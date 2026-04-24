export const exportChatToPDF = (data: any) => {
  console.log("exportChatToPDF not implemented yet", data);
};

export const exportChatToTXT = (data: any) => {
  console.log("exportChatToTXT not implemented yet", data);
};

export const exportChatToJSON = (data: any) => {
  return JSON.stringify(data, null, 2);
};
}
