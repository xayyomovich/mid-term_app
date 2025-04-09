import { PubSub } from 'graphql-subscriptions';
import { verifyPassword, generateToken } from '../auth.js';

const pubsub = new PubSub();

const resolvers = {
    Query: {
      me: (_, __, context) => {
        if (!context.user) {
            throw new Error('Authentication required. No token provided.');
        }
        return context.user;
      },
      messages: (_, __, context) => {
        return context.userMethods.getAllMessages();
      }
    },

    Mutation: {
        login: async (_, { email, password }, context) => {
            try {
                const user = await context.userMethods.getUserByEmail(email);
                
                if (!user) {
                  throw new Error('Invalid credentials');
                }

                const isValid = verifyPassword(password, user.password);
          
                if (!isValid) {
                  throw new Error('Invalid credentials');
                }

                const token = generateToken(user);
          
                return {
                  token,
                  user: {
                    id: user.id,
                    email: user.email,
                    password: user.password
                  }
                };
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        },

        sendMessage: (_, { content }, context) => {
            console.log('user in sendMessage resolver:', context.user);
            if (!context.user) {
                throw new Error('You must be logged in to send a message');
            }

            const message = {
                id: String(Date.now()),
                content,
                senderId: context.user.id,
                senderEmail: context.user.email,
                createdAt: new Date().toISOString()
            };

            context.userMethods.saveMessage(message);


            console.log('Publishing message:', message);
            pubsub.publish('MESSAGE_ADDED', { messageAdded: message });
            pubsub.publish('MESSAGE_SENT', { messageSent: message });

            return message;
        }
    },

    Subscription: {
        messageAdded: {
            subscribe: (_, __, context) => {
                console.log('Subscription attempt for messageAdded by:', context.user?.email);
                
                if (!context.user) {
                    throw new Error('Authentication required for message subscription');
                }
                
                console.log('Subscription to MESSAGE_ADDED successful');
                return pubsub.asyncIterableIterator(['MESSAGE_ADDED']);
            }
        },
        messageSent: {
            subscribe: (_, __, context) => {
                console.log('Subscription attempt for messageSent by:', context.user?.email);
                
                if (!context.user) {
                    throw new Error('Authentication required for message subscription');
                }
                
                console.log('Subscription to MESSAGE_SENT successful');
                return pubsub.asyncIterableIterator(['MESSAGE_SENT']);
            }
        }
    }
};

export { resolvers };