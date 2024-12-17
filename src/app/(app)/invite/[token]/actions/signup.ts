"use server";

import config from "@payload-config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation"
import { Customer } from "@/payload-types";
import { getPayload } from "payload";

// we cannot import the type from payload/dist.../login so we define it here
export type Result = {
  exp?: number;
  token?: string;
  user?: Customer;
};

export interface SignupResponse {
  success: boolean;
  error?: string; 
}

interface SignupParams {
  email: string;
  password: string;
}

export async function signup({ email, password, invitationToken }: SignupParams): Promise<SignupResponse> {
  const payload = await getPayload({ config });

  const {docs} = await payload.find({
    collection: 'invitations',
    where: {
      memberId: {
        invitationToken: invitationToken,
      },
    }  })

  console.log(docs)
  try {
    await payload.create({
      collection: "customers",
      data: {
        email,
        password,
      },
    });

    const result: Result = await payload.login({
      collection: "customers",
      data: {
        email,
        password,
      },
    });

    if (result.token) {
      let cookieStore = await cookies();
      cookieStore.set({
        name: 'payload-token',
        value: result.token,
        httpOnly: true,
        path: '/',
      });

      return { success: true}
    }else{
      console.log('Login failed: No token received');
      return { success: false, error: "An error occurred"}
    }
  } catch (error) {
    console.log(error);
    return { success: false, error: "An error occurred"}
  }
}
