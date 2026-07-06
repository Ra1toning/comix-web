/** Firebase Auth алдааны кодыг хэрэглэгчид ойлгомжтой монгол мессеж болгоно. */
export const authErrorMessage = (error: unknown): string => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: string }).code)
      : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "Энэ имэйл аль хэдийн бүртгэгдсэн байна. Нэвтэрч орно уу.";
    case "auth/invalid-email":
      return "Имэйл хаяг буруу форматтай байна.";
    case "auth/weak-password":
      return "Нууц үг хэт сул байна. 6-с доошгүй тэмдэгт ашиглана уу.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Имэйл эсвэл нууц үг буруу байна.";
    case "auth/too-many-requests":
      return "Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу.";
    case "auth/network-request-failed":
      return "Сүлжээний алдаа гарлаа. Интернэт холболтоо шалгана уу.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google цонх хаагдсан тул нэвтрэлт цуцлагдлаа.";
    case "auth/popup-blocked":
      return "Хөтөч popup цонхыг хориглосон байна. Popup-г зөвшөөрнө үү.";
    case "auth/account-exists-with-different-credential":
      return "Энэ имэйл өөр аргаар бүртгэгдсэн байна. Имэйл/нууц үгээрээ нэвтэрнэ үү.";
    case "auth/email-not-verified":
      return "Имэйл хаягаа баталгаажуулна уу. Баталгаажуулах холбоосыг имэйл рүү тань дахин илгээлээ.";
    case "auth/requires-recent-login":
      return "Аюулгүй байдлын үүднээс дахин нэвтэрч байж энэ үйлдлийг хийнэ.";
    case "auth/unauthorized-continue-uri":
      return "Сайтын domain Firebase-д зөвшөөрөгдөөгүй байна. Админд хандана уу.";
    default:
      return "Алдаа гарлаа. Дахин оролдоно уу.";
  }
};
