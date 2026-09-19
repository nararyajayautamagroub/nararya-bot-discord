const invitePattern=new RegExp("discord(?:app)?\\\\.com/invite/","i");
const urlPattern=/https?:\/\//i;
export const hasInvite=s=>invitePattern.test(String(s||""));
export const hasURL=s=>urlPattern.test(String(s||""));