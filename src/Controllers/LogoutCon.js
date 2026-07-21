export async function LogoutController(req,res,next){
  try {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/"
    })

    return res.status(200).json({message: "Logged out successfully"})
  } catch (error) { return next(error) }
}