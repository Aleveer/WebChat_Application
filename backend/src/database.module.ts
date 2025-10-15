import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/webchat";
  return uri;
}

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: getMongoUri(),
        dbName: process.env.MONGODB_DB,
      }),
    }),
  ],
})
export class DatabaseModule {}
