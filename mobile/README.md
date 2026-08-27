# Bom Currículo Mobile

Site: https://bomcurriculo.tech

## Configuração de ambiente

O app usa `.env` para definir a URL da API por tipo de dispositivo. O arquivo `.env` está no `.gitignore`, cada desenvolvedor mantém seu próprio.

Copie o exemplo:
```bash
cp .env.example .env
```

Variáveis principais:
- `API_URL_DEV_PHYSICAL` - IP da máquina onde o backend roda, ex: `http://192.168.1.100:9000`. Use seu IP local para testar no celular físico.
- `API_URL_PROD` - URL de produção.
- `API_URL_ANDROID_EMULATOR` - `http://10.0.2.2:9000` para emulador Android.
- `API_URL_IOS_EMULATOR` - `http://localhost:9000` para simulador iOS.

O app também aceita override via dart-define:
```bash
flutter run --dart-define=API_URL=http://192.168.X.X:9000
```

### Cleartext HTTP em desenvolvimento

Para builds de debug o Android permite tráfego HTTP local via `android/app/src/main/res/xml/network_security_config.xml`. Em release o cleartext é bloqueado e só HTTPS é permitido.

Views:

    Auth:
        
        Login: efetuar login no sistema
        Register: cadastrar no sistema
        ForgotPassword: recuperação de senha
        VerifyOTP: verificação do token pra alterar senha
        ResetPassword: altera a senha

    Home: Tela inicial
    MyResumes: Meus currículos
    ValidadeResume: Envia dados do currículo
    GenerateResume: Gera o currículo
