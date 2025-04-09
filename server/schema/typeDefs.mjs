const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    password: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }
  
  type Message {
    id: ID!
    content: String!
    senderId: ID!
    senderEmail: String!
    createdAt: String!
  }

  type Query {
    me: User
    messages: [Message!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    sendMessage(content: String!): Message!
  }
  
  type Subscription {
    messageAdded: Message!
    messageSent: Message!
  }
`;

export { typeDefs };