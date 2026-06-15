export type BoardMemberView = {
  userId: string;
  name: string;
  email: string;
  role: "owner" | "member";
};

export type BoardListItem = {
  id: string;
  name: string;
  bgColor: string;
  role: "owner" | "member";
};
