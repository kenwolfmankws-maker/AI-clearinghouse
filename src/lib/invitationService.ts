export async function getInvitationByToken(_token: string) {
  throw new Error("Invitation system is currently disabled.");
}

export async function acceptInvitation(_token: string) {
  throw new Error("Invitation system is currently disabled.");
}

export async function declineInvitation(_token: string) {
  throw new Error("Invitation system is currently disabled.");
}

export const invitationService = {
  sendInvite: async () => {
    console.log("invites disabled");
    return null;
  },
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
};
