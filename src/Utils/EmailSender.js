import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendEmail = async (options) => {
  const { data, error } = await resend.emails.send({
    from: `${process.env.BRAND_NAME} <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  })

  if (error || !data ) {throw new Error(error.message)}

  return data
}