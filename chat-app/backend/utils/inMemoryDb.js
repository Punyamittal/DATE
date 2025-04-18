/**
 * In-memory database for development when MongoDB is not available
 * This allows the app to function without a real database for testing
 * NOTE: All data will be lost when the server restarts
 */

// Store collections as objects
const db = {
  users: [],
  matches: [],
  messages: []
};

// Generate simple IDs
let idCounter = 1;
const generateId = () => (idCounter++).toString();

// Common helper functions
const findById = (collection, id) => {
  return db[collection].find(item => item._id === id);
};

const findOne = (collection, query) => {
  return db[collection].find(item => {
    for (const key in query) {
      if (item[key] !== query[key]) {
        return false;
      }
    }
    return true;
  });
};

const find = (collection, query = {}) => {
  if (Object.keys(query).length === 0) {
    return [...db[collection]]; // Return a copy of all items
  }
  
  return db[collection].filter(item => {
    for (const key in query) {
      // Special handling for $ne operator
      if (typeof query[key] === 'object' && query[key].$ne !== undefined) {
        if (item[key] === query[key].$ne) {
          return false;
        }
      } 
      // Special handling for $gt operator
      else if (typeof query[key] === 'object' && query[key].$gt !== undefined) {
        if (item[key] <= query[key].$gt) {
          return false;
        }
      }
      // Handle $or operator
      else if (key === '$or') {
        const orConditions = query[key];
        let orResult = false;
        
        for (const condition of orConditions) {
          let conditionMet = true;
          for (const condKey in condition) {
            if (item[condKey] !== condition[condKey]) {
              conditionMet = false;
              break;
            }
          }
          
          if (conditionMet) {
            orResult = true;
            break;
          }
        }
        
        if (!orResult) return false;
      }
      // Regular equality check
      else if (query[key] !== undefined && item[key] !== query[key]) {
        return false;
      }
    }
    return true;
  });
};

// CRUD operations for users
const users = {
  create: async (userData) => {
    const user = { 
      ...userData, 
      _id: generateId(),
      createdAt: new Date()
    };
    db.users.push(user);
    return user;
  },
  
  findById: async (id) => {
    return findById('users', id);
  },
  
  findOne: async (query) => {
    return findOne('users', query);
  },
  
  find: async (query) => {
    return find('users', query);
  },
  
  findByIdAndUpdate: async (id, update) => {
    const user = findById('users', id);
    if (!user) return null;
    
    if (update.$set) {
      Object.assign(user, update.$set);
    } else {
      Object.assign(user, update);
    }
    
    return user;
  },
  
  updateOne: async (query, update) => {
    const user = findOne('users', query);
    if (!user) return { n: 0, nModified: 0 };
    
    if (update.$set) {
      Object.assign(user, update.$set);
    } else {
      Object.assign(user, update);
    }
    
    return { n: 1, nModified: 1 };
  },
  
  updateMany: async (query, update) => {
    const matchingUsers = find('users', query);
    if (matchingUsers.length === 0) return { n: 0, nModified: 0 };
    
    for (const user of matchingUsers) {
      if (update.$set) {
        Object.assign(user, update.$set);
      } else {
        Object.assign(user, update);
      }
    }
    
    return { n: matchingUsers.length, nModified: matchingUsers.length };
  }
};

// CRUD operations for matches
const matches = {
  create: async (matchData) => {
    const match = { 
      ...matchData, 
      _id: generateId(),
      createdAt: new Date()
    };
    db.matches.push(match);
    return match;
  },
  
  findById: async (id) => {
    return findById('matches', id);
  },
  
  findOne: async (query) => {
    return findOne('matches', query);
  },
  
  find: async (query) => {
    return find('matches', query);
  },
  
  findByIdAndUpdate: async (id, update) => {
    const match = findById('matches', id);
    if (!match) return null;
    
    if (update.$set) {
      Object.assign(match, update.$set);
    } else {
      Object.assign(match, update);
    }
    
    return match;
  }
};

// CRUD operations for messages
const messages = {
  create: async (messageData) => {
    const message = { 
      ...messageData, 
      _id: generateId(),
      createdAt: new Date()
    };
    db.messages.push(message);
    return message;
  },
  
  find: async (query) => {
    return find('messages', query);
  },
  
  updateMany: async (query, update) => {
    const matchingMessages = find('messages', query);
    if (matchingMessages.length === 0) return { n: 0, nModified: 0 };
    
    for (const message of matchingMessages) {
      if (update.$set) {
        Object.assign(message, update.$set);
      } else {
        Object.assign(message, update);
      }
    }
    
    return { n: matchingMessages.length, nModified: matchingMessages.length };
  }
};

// Mock User model for bcrypt password hashing
const createUserModel = () => {
  const userSchema = {
    pre: (hook, callback) => {
      // Simulate the save middleware for password hashing
      const originalCreate = users.create;
      users.create = async (userData) => {
        if (userData.password && hook === 'save') {
          // Simple "hash" for development (don't use in production)
          userData.password = `hashed_${userData.password}`;
        }
        return originalCreate(userData);
      };
      
      return userSchema;
    },
    
    methods: {
      comparePassword: async function(candidatePassword) {
        // Simple "comparison" for development
        return this.password === `hashed_${candidatePassword}`;
      }
    },
    
    index: () => userSchema
  };
  
  // Add methods to the User "model"
  Object.assign(users, userSchema.methods);
  
  return users;
};

// Export all models
module.exports = {
  isInMemoryMode: true,
  User: createUserModel(),
  Match: matches,
  Message: messages
}; 