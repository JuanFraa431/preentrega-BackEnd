const nodemailer = require('nodemailer');

async function sendPasswordResetEmail(email, token) {
    const transporter = nodemailer.createTransport({

        service: 'gmail',
        auth: {
            user: 'juanfraa032@gmail.com', 
            pass: 'uoma cair nlvx uxrs' 
        }
    });

    const mailOptions = {
        from: 'somosprueba@gmail.com',
        to: email,
        subject: 'Restablecer contraseña',
        html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                <a href="http://localhost:8080/api/sessions/reset-password/${token}">Restablecer contraseña</a>`
    };

    await transporter.sendMail(mailOptions);
}

module.exports = {
    sendPasswordResetEmail
};