const cron = require('node-cron');
const { Op } = require('sequelize');
const { Turno, Usuario, Barbero, Servicio } = require('../models');
const { enviarRecordatorioTurno } = require('../services/mail.service');

async function revisarYEnviarRecordatorios() {
  const ahora = new Date();

  // Turnos candidatos: no cancelados/atendidos, y sin recordatorio enviado todavía.
  const turnosCandidatos = await Turno.findAll({
    where: {
      estado: { [Op.in]: ['PENDIENTE', 'CONFIRMADO'] },
      recordatorio_enviado: false,
    },
  });

  for (const turno of turnosCandidatos) {
    const fechaHoraTurno = new Date(`${turno.fecha}T${turno.hora_inicio}`);
    const horasHastaElTurno = (fechaHoraTurno - ahora) / (1000 * 60 * 60);

    // Como el cron corre cada hora, esta ventana de 23 a 24hs asegura que
    // cada turno caiga en la ventana exactamente una vez.
    if (horasHastaElTurno <= 24 && horasHastaElTurno > 23) {
      try {
        const cliente = await Usuario.findByPk(turno.cliente_id);
        const barbero = await Barbero.findByPk(turno.barbero_id);
        const servicio = await Servicio.findByPk(turno.servicio_id);

        await enviarRecordatorioTurno(turno, cliente, barbero, servicio);

        turno.recordatorio_enviado = true;
        await turno.save();

        console.log(`Recordatorio enviado para el turno ${turno.turno_id}`);
      } catch (error) {
        console.error(`Error mandando recordatorio del turno ${turno.turno_id}:`, error.message);
      }
    }
  }
}

function iniciarCronRecordatorios() {
  // Corre en el minuto 0 de cada hora.
  cron.schedule('0 * * * *', () => {
    console.log('Revisando turnos para mandar recordatorios...');
    revisarYEnviarRecordatorios();
  });
}

module.exports = { iniciarCronRecordatorios };