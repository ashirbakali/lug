const fs = require('fs');
const SimpleSchema = require('simpl-schema').default;
const { v4: uuidv4 } = require('uuid');

const { Chat } = require('../model/chat.js');
const { User } = require('../model/user.js');
const { sendNotification } = require("../services/fcmTokenService.js");

const messageSchema = new SimpleSchema({
    sender: String,
    receiver: String,
    type: String,
    message: String,
    file: {
        type: Buffer,
        optional: true
    }
}).newContext();

exports.initChat = (server) => {
    const io = require('socket.io')(server, {
        pinTimeOut: 60000,
        cors: {
            origin: "*",
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        socket.emit('connected', 'Connected! Please subscribe to register event now!')

        socket.on('disconnect', () => {
            console.log('user has disconnected');
        });

        // Offline Status for User
        socket.on('offline', (response) => {
            if (response.id === undefined) return socket.emit("error", "Error! Id is undefined");

            User.findById(response.id).select("onlineStatus").then(status => {
                status.onlineStatus = "OFFLINE";
                return status.save();
            }).then(response => {
                socket.emit("offline", response);
                io.sockets.emit("user_status", { _id: response.id, onlineStatus: "OFFLINE" });
            }).catch(err => {
                socket.emit("error", err.message);
            });
        });

        // Online Status for User
        socket.on('online', (response) => {
            if (response.id === undefined) return socket.emit("error", "Error! Id is undefined");

            User.findById(response.id).select("onlineStatus").then(status => {
                status.onlineStatus = "ONLINE";
                return status.save();
            }).then(response => {
                socket.emit("online", response);
                io.sockets.emit("user_status", { _id: response.id, onlineStatus: "ONLINE" });
            }).catch(err => {
                socket.emit("error", err.message);
            });
        });

        // Check User status
        socket.on("user_status", (response) => {
            User.findById(response.id).select("onlineStatus").then(status => {
                socket.emit("user_status", status)
            }).catch(err => { return socket.emit("error", err.message) })
        });

        // register user on socket
        socket.on('register', (response) => {
            if (response.id === undefined) return socket.emit("error", "Registration failed! Id is undefined");
            socket.join(response.id);
        });

        // Typing
        socket.on('typing', (data) => {
            socket.to(data.receiver).emit('typing', { sender: data.sender });
        });

        // Not Typing
        socket.on('not_typing', (data) => {
            socket.to(data.receiver).emit('not_typing', { sender: data.sender });
        });

        // List of all the chats
        socket.on("chat_list", async (response) => {
            let list = await User.findById(response.id).select("chatFriends").lean();

            if (list?.chatFriends) {
                let userlist = await Promise.all(list?.chatFriends?.map(async (list) => {
                    return {
                        user: await User.findById(list.userId).select("profile fullname email nickname"),
                        chat: list?.chat,
                        type: list?.contentType,
                        read: list?.read,
                        senderId: list?.senderId
                    }
                }))
                socket.emit('chat_list', userlist);
            }
        });

        // Specific chat messages
        socket.on('chat_messages', async (response) => {
            const sender = await User.findOne({ '_id': response?.sender });
            const receiver = await User.findOne({ '_id': response?.receiver });

            if (!sender) return socket.emit('error', `The sender's id doesn't exists in database, ID: ${response?.sender}`);
            if (!receiver) return socket.emit('error', `The receiver's id doesn't exists in database, ID: ${response?.receiver}`);
            const chats = await Chat.find({
                $or: [
                    { sender: response?.sender, receiver: response?.receiver }, { sender: response?.receiver, receiver: response?.sender }
                ]
            }).sort({ _id: -1 });

            let chatString;
            for (var i = 0; i < receiver?.chatFriends?.length; i++) {
                if (receiver?.chatFriends[i]?.userId === sender?.id) {
                    chatString = receiver?.chatFriends[i].chat;
                }
            }
            await User.updateOne(
                { _id: receiver?._id },
                { $set: { 'chatFriends.$[elem].read': true } },
                { arrayFilters: [{ 'elem.chat': chatString }] }
            );

            socket.emit('chat_messages', chats);
        });

        // Send messages
        socket.on('message', async (message) => {
            try {
                if (!message?.message && !message?.file) {
                    return socket.emit("error", `Message and file are both undefined or empty`);
                }

                if (message?.type === 'file' && message?.file) {
                    message.file = Buffer.from(message.file, "base64");
                }

                const isValid = messageSchema.validate(message);
                if (!isValid) return socket.emit("error", `The response doesn't satisfy the standard schema`);
                if (message.sender === message.receiver) return socket.emit('error', `Sender cannot be the receiver`);

                const sender = await User.findById(message.sender);
                const receiver = await User.findById(message.receiver);
                if (!sender) return socket.emit('error', `The sender's ID doesn't exist in the database, ID: ${message.sender}`);
                if (!receiver) return socket.emit('error', `The receiver's ID doesn't exist in the database, ID: ${message.receiver}`);

                // Save file if the type is file
                if (message.type === "file") {
                    message.message = `${uuidv4()}.${message.message.split('.').pop()}`;
                    const filePath = path.join(uploadsDir, message.message);

                    await fileStore.writeFile(filePath, message.file);
                    delete message.file;
                    message.message = `http://lug.testdevlink.net/uploads/${message.message}`;
                }

                let findSenderChatList = sender.chatFriends.findIndex(x => x.userId === receiver.id);
                if (findSenderChatList !== -1) {
                    sender.chatFriends.splice(findSenderChatList, 1);
                }
                sender.chatFriends.unshift({
                    userId: receiver.id,
                    chat: message.message,
                    contentType: message.type,
                    senderId: sender.id
                });

                let findReceiverChatList = receiver.chatFriends.findIndex(x => x.userId === sender.id);
                if (findReceiverChatList !== -1) {
                    receiver.chatFriends.splice(findReceiverChatList, 1);
                }
                receiver.chatFriends.unshift({
                    userId: sender.id,
                    chat: message.message,
                    contentType: message.type,
                    senderId: sender.id
                });

                await User.updateOne({ _id: sender._id }, sender);
                await User.updateOne({ _id: receiver._id }, receiver);

                const savedMessage = await new Chat(message).save();
                socket.to(message.receiver).emit('message', savedMessage);
                sender.password = ""; // Avoid sending password
                sendNotification(receiver.fcmToken, `${sender.fullname} sent you a message`, message.message, sender.profile);
                socket.emit('message', savedMessage);

            } catch (error) {
                console.error("Error:", error.message);
                socket.emit('error', "Something went wrong while updating sender or receiver.");
            }
        });
    })
}