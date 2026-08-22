export const ROUTE_LINKS = {
  login: "/entrar",
  register: "/cadastrar",
  sendOtp: "/enviar-otp",
  forgotPassword: "/esqueci-minha-senha",
  changePassword: "/alterar-senha",

  home: "/",
  myResumes: "/meus-curriculos",
  newResume: "/novo-curriculo",

  resumeConfirm: "/meu-curriculo/:id/confirmar",
  resumeConfirmId:(id:string)=>`/meu-curriculo/${id}/confirmar`
} as const;