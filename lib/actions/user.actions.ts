"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();

  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", [email])]
  );

  return result.total > 0 ? result.documents[0] : null;
};

export const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();

  try {
    const session = await account.createEmailToken(ID.unique(), email);

    return session.userId;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to send email OTP");
  }
};

export const createAccount = async ({ fullName, email }: { fullName: string; email: string }) => {
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    throw new Error("User already exists");
  }

  const accountId = await sendEmailOTP({ email });

  const { databases } = await createAdminClient();

  await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    ID.unique(),
    {
      fullName,
      email,
      avatar: "/assets/images/avatar.png",
      accountId,
    }
  );

  return parseStringify({ accountId });
}

export const verifyOTP = async ({ accountId, otp }: { accountId: string; otp: string }) => {
  try {
    const { account } = await createAdminClient();
    const session = await account.createSession(accountId, otp);

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      sameSite: "strict",
      secure: true,
      httpOnly: true,
    });

    return parseStringify({ sessionId: session.$id });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to verify OTP");
  }
}

export const getCurrentUser = async () => {
  const { account, databases } = await createSessionClient();

  const result = await account.get();

  const user = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("accountId", result.$id)]
  );

  if (user.total <= 0) return null;

  return parseStringify(user.documents[0]);
}

export const signOutUser = async () => {
  const { account } = await createSessionClient();

  try {
    await account.deleteSession("current");
    (await cookies()).delete("appwrite-session");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to sign out user");
  } finally {
    redirect("/sign-in");
  }
}

export const signInUser = async ({ email }: { email: string }) => {
  try {
    const user = await getUserByEmail(email);

    if (!user) {
      throw new Error("User not found");
    }

    await sendEmailOTP({ email });
    return parseStringify({ accountId: user.accountId });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to sign in user");
  }
}