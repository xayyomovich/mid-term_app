import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import express from 'express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import cors from 'cors';
import { resolvers} from './schema/resolvers.mjs'
import { typeDefs} from './schema/typeDefs.mjs';

import { verifyToken } from './auth.js';
import { userMethods } from './db.js';

const app = express();
const httpServer = createServer(app);

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const server = new ApolloServer({
    schema,
    plugins: [    
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
      ],
});


const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/subscriptions',
  });
  
  
const serverCleanup = useServer({
    schema,
    context: async (ctx) => {
      const token = ctx.connectionParams?.Authorization?.replace('Bearer ', '') || '';
      console.log('Received token:', token);
  
      let user = null;
  
      if (token) {
        try {
          const decodedToken = verifyToken(token);
          console.log('Decoded token:', decodedToken);
          if (decodedToken && decodedToken.id) {
            user = await userMethods.getUserById(decodedToken.id);
            console.log('Authenticated user:', user)
            console.log(user)
          }
        } catch (error) {
          console.error('WebSocket auth error:', error);
        }
      }
  
      return {
        token,
        user,
        isAuth: !!user,
        userMethods
      };
    },
    onConnect: (ctx) => {
      console.log('Client connected:', ctx);
      return ctx;
    },
    onDisconnect: (ctx) => {
      console.log('Client disconnected:', ctx);
    },
  }, wsServer);
  

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });



await server.start();
app.use(
  '/graphql',
  express.json(),
  cors({
    origin: '*',
    credentials: true,
  }),
  expressMiddleware(server, {
    context: async ({ req }) => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '');

        let user = null;
    
        if (token) {
            try {
                const decodedToken = verifyToken(token);

                if (decodedToken && decodedToken.id) {
                    user = await userMethods.getUserById(decodedToken.id);
                    console.log('Authenticated user in HTTP context:', user);
                }
            } catch (error) {
                console.error('Token verification error:', error);
            }
        }
        
        return {
            token,
            user,
            isAuth: !!user,
            userMethods,
        }
    }
  }),
);


const PORT = 4000;

httpServer.listen(PORT, () => {
  console.log(`Server is now running on http://localhost:${PORT}/graphql`);
});