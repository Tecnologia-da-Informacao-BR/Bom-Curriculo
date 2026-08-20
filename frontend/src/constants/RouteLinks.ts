export const ROUTES_LINKS = {
  login: "/entrar",
  register: "/cadastrar",
  sendEmail: "/enviar-otp",
  forgotPassword: "/esqueci-minha-senha",
  resetPassword: "/alterar-senha",

  home: "/",
  myResumes: "/meus-curriculos",
  newResume: "/novo-curriculo",

  resumeConfirm: "/meu-curriculo/:id/confirmar",

  resumeConfirmId:(id:number)=>`/meu-curriculo/${id}/confirmar`
} as const;