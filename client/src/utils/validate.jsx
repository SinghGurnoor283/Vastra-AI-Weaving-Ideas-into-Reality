const checkValidateData = (email, password, isSignUp = false) => {
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]).{8,}$/;

  if (!emailRegex.test(email)) return "❌ Invalid email format.";
  
  if (isSignUp && !passwordRegex.test(password)) {
    return "❌ Password must be at least 8 characters long, include one uppercase letter and one special character.";
  }

  if (!password) return "❌ Password cannot be empty.";

  return null;
};

export default checkValidateData;
