const nodemailer = require('nodemailer');

// Configuramos el transporter una sola vez, se reutiliza en todos los envíos.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const remitente = `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`;

// Formatea fecha/hora de forma legible para los mails
// (ej: "viernes 10/07/2026 a las 10:00").
function formatearFechaHora(fecha, hora) {
  const fechaObj = new Date(`${fecha}T${hora}`);
  const fechaTexto = fechaObj.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaTexto = hora.substring(0, 5); // "10:00:00" -> "10:00"
  return `${fechaTexto} a las ${horaTexto}`;
}

async function enviarConfirmacionTurno(turno, cliente, barbero, servicio) {
  const fechaHora = formatearFechaHora(turno.fecha, turno.hora_inicio);

  await transporter.sendMail({
    from: remitente,
    to: cliente.email,
    subject: 'Confirmación de tu turno - Barbería Alto Corte',
    html: `
      <h2>¡Turno confirmado, ${cliente.nombre}!</h2>
      <p>Tu turno quedó agendado para el <strong>${fechaHora}</strong>.</p>
      <ul>
        <li><strong>Barbero:</strong> ${barbero.nombre_completo}</li>
        <li><strong>Servicio:</strong> ${servicio.nombre}</li>
      </ul>
      <p>Si necesitás cancelar o reprogramar, hacelo desde la app con al menos 6 horas de anticipación.</p>
    `,
  });
}

async function enviarCancelacionTurno(turno, cliente, barbero, servicio) {
  const fechaHora = formatearFechaHora(turno.fecha, turno.hora_inicio);

  await transporter.sendMail({
    from: remitente,
    to: cliente.email,
    subject: 'Tu turno fue cancelado - Barbería Alto Corte',
    html: `
      <h2>Turno cancelado</h2>
      <p>Hola ${cliente.nombre}, te confirmamos que tu turno del <strong>${fechaHora}</strong>
      con ${barbero.nombre_completo} (${servicio.nombre}) fue cancelado.</p>
      <p>Podés agendar uno nuevo cuando quieras desde la app.</p>
    `,
  });
}

async function enviarRecordatorioTurno(turno, cliente, barbero, servicio) {
  const fechaHora = formatearFechaHora(turno.fecha, turno.hora_inicio);

  await transporter.sendMail({
    from: remitente,
    to: cliente.email,
    subject: 'Recordatorio: tenés un turno mañana - Barbería Alto Corte',
    html: `
      <h2>¡Te esperamos mañana!</h2>
      <p>Hola ${cliente.nombre}, te recordamos tu turno del <strong>${fechaHora}</strong>
      con ${barbero.nombre_completo} (${servicio.nombre}).</p>
    `,
  });
}

module.exports = {
  enviarConfirmacionTurno,
  enviarCancelacionTurno,
  enviarRecordatorioTurno,
};