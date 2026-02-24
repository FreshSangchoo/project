interface DecodedToken {
  userTsid: string | null;
  userRole: string | null;
}

export const decodeBase64Url = (base64Url: string): string => {
  try {
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const decodedData = atob(base64);
    return decodeURIComponent(
      decodedData
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  } catch (error) {
    console.error("Error decoding base64 URL:", error);
    return "";
  }
};

// 토큰에서 아이디랑 역할 가져오기
export const getTokenInfo = (token: string): DecodedToken => {
  try {
    const parts = token.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      const jwtToken = parts[1];
      const payloadBase64Url = jwtToken.split(".")[1];
      const decodedPayload = decodeBase64Url(payloadBase64Url);
      const decodedToken = JSON.parse(decodedPayload);
      return { userTsid: decodedToken.username, userRole: decodedToken.role };
    } else {
      throw new Error("Invalid token format");
    }
  } catch (error) {
    console.error("Error decoding token:", error);
    return { userTsid: null, userRole: null };
  }
};