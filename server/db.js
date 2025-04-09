import { hashPassword } from "./auth.js"

const users = [
    { id: 1, email: "sam@gmail.com", password: hashPassword("sm1234") },
    { id: 2, email: "john@gmail.com", password: hashPassword("johndoe") },
];

const messages = [];

export const userMethods = {
    getUserById: async (id) => {
        const user = users.find(u => u.id === id);
        return user || null;
    },
    
    getUserByEmail: async (email) => {
        const user = users.find(u => u.email === email);
        return user || null;
    },
    
    getAllMessages: () => {
        return [...messages];
    },
    
    saveMessage: (message) => {
        messages.push(message);
        if (messages.length > 100) {
            messages.shift();
        }
        return message;
    }
};
