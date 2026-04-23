export const emailService = {
  sendWelcomeEmail: async () => {
    console.log("email disabled");
    return { data: null, error: null };
  },
  sendInviteEmail: async () => {
    console.log("email disabled");
    return { data: null, error: null };
  },
};
export async function sendWelcomeEmail(..._args: any[]) {
  throw new Error("sendWelcomeEmail not implemented yet");
}
