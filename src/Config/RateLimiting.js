export const CsrfLimit = { // 30 req in 1 min
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: false,
  legacyHeaders: false
}

export const LoginLimit = { // 05 req in 15 min
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: false,
    legacyHeaders: false,
    message:'Too many requests please try again later'
}

export const RegisterLimit = { // 03 req in 01 min
    windowMs: 60 * 1000,
    max: 3,
    standardHeaders: false,
    legacyHeaders: false,
    message:'Too many requests please try again later'
}

export const ForgotPasswordLimit = { // 5 req in 10 min
    windowMs: 10 * 60 * 1000,
    max: 5,
    standardHeaders: false,
    legacyHeaders: false,
    message:'Too many requests please try again later'
}

export const ResetPasswordLimit = { // 10 req in 10 min
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: false,
    legacyHeaders: false,
    message:'Too many requests please try again later'
}

export const PublicLimit = { // 50 req in 01 min
    windowMs: 1 * 60 * 1000,
    max: 50,
    standardHeaders: false,
    legacyHeaders: false,
    message:'Too many requests please try again later'
}

export const SearchLimit = { // 60 req in 01 min
    windowMs: 1 * 60 * 1000,
    max: 60,
    standardHeaders: false,
    legacyHeaders: false,
    message:'Too many requests please try again later'
}

export const AdminLoginLimit = { // 3 req in 01 min
    windowMs: 60 * 1000,
    max: 3,
    standardHeaders: false,
    legacyHeaders: false,
    message:'Too many requests please try again later'
}

export const OTPLimit = { // 05 req in 10 min
    windowMs: 10 * 60 * 1000,
    max: 5,
    standardHeaders: false,
    legacyHeaders: false,
    message:'Too many requests please try again later'
}

export const FileUploadLimit = { // 10 req in 01 min
    windowMs: 1 * 60 * 1000,
    max: 10,
    standardHeaders: false,
    legacyHeaders: false,
    message:'Too many requests please try again later'
}

export const ContactLimit = { // 03 req in 01 min
    windowMs: 1 * 60 * 1000,
    max: 3,
    standardHeaders: false,
    legacyHeaders: false,
    message:'Too many requests please try again later'
}
