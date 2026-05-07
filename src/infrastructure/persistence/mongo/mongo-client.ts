import { MongoClient, type Db } from 'mongodb';

export interface MongoConnectionConfig {
  uri: string;
  dbName: string;
  serverSelectionTimeoutMs?: number;
}

export interface MongoConnection {
  client: MongoClient;
  db: Db;
}

export async function connectMongo(config: MongoConnectionConfig): Promise<MongoConnection> {
  const client = new MongoClient(config.uri, {
    serverSelectionTimeoutMS: config.serverSelectionTimeoutMs ?? 5000,
    retryWrites: true,
    retryReads: true,
  });
  await client.connect();
  return { client, db: client.db(config.dbName) };
}
