import { test, expect } from '@playwright/test';

test('duration reservations basic happy', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('button', { name: 'Reservas' }).click();
    await page.getByRole('spinbutton', { name: 'Duración de la cita (minutos)' }).click();
    await page.getByRole('spinbutton', { name: 'Duración de la cita (minutos)' }).fill('120');
    await page.getByRole('spinbutton', { name: 'Espacio entre citas (minutos)' }).click();
    await page.getByRole('spinbutton', { name: 'Espacio entre citas (minutos)' }).fill('030');
    await page.getByRole('textbox', { name: 'Hora de inicio (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de inicio (HH:MM)' }).press('ArrowLeft');
    await page.getByRole('textbox', { name: 'Hora de inicio (HH:MM)' }).press('ArrowLeft');
    await page.getByRole('textbox', { name: 'Hora de inicio (HH:MM)' }).press('ArrowLeft');
    await page.getByRole('textbox', { name: 'Hora de inicio (HH:MM)' }).fill('06:00');
    await page.getByRole('textbox', { name: 'Hora de fin (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de fin (HH:MM)' }).press('ArrowLeft');
    await page.getByRole('textbox', { name: 'Hora de fin (HH:MM)' }).press('ArrowLeft');
    await page.getByRole('textbox', { name: 'Hora de fin (HH:MM)' }).press('ArrowLeft');
    await page.getByRole('textbox', { name: 'Hora de fin (HH:MM)' }).fill('20:00');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByText('Configuración guardada con é')).toContainText('Configuración guardada con éxito');
    await page.reload();
    await expect(page.getByRole('spinbutton', { name: 'Duración de la cita (minutos)' })).toHaveValue('120');
    await expect(page.getByRole('spinbutton', { name: 'Espacio entre citas (minutos)' })).toHaveValue('30');
    await expect(page.getByRole('textbox', { name: 'Hora de inicio (HH:MM)' })).toHaveValue('06:00');
    await expect(page.getByRole('textbox', { name: 'Hora de fin (HH:MM)' })).toHaveValue('20:00');
    await page.getByRole('spinbutton', { name: 'Duración de la cita (minutos)' }).click();
    await page.getByRole('spinbutton', { name: 'Duración de la cita (minutos)' }).fill('60');
    await page.getByRole('spinbutton', { name: 'Espacio entre citas (minutos)' }).click();
    await page.getByRole('spinbutton', { name: 'Espacio entre citas (minutos)' }).fill('15');
    await page.getByRole('textbox', { name: 'Hora de inicio (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de inicio (HH:MM)' }).press('ArrowLeft');
    await page.getByRole('textbox', { name: 'Hora de inicio (HH:MM)' }).press('ArrowLeft');
    await page.getByRole('textbox', { name: 'Hora de inicio (HH:MM)' }).press('ArrowLeft');
    await page.getByRole('textbox', { name: 'Hora de inicio (HH:MM)' }).fill('09:00');
    await page.getByRole('textbox', { name: 'Hora de fin (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de fin (HH:MM)' }).press('ArrowLeft');
    await page.getByRole('textbox', { name: 'Hora de fin (HH:MM)' }).press('ArrowLeft');
    await page.getByRole('textbox', { name: 'Hora de fin (HH:MM)' }).press('ArrowLeft');
    await page.getByRole('textbox', { name: 'Hora de fin (HH:MM)' }).fill('18:00');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await page.reload();
});

/* 
da error porque en el backend no se puede crear una reserva que no sea:
09:00 - 10:00
10:15 - 11:15
11:30 - 12:30
etc.
Hay que cambiar eso y permitir que sea en cualquier momento y que el espacio entre citas se aplique despues
*/
test('añadir reserva happy', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('button', { name: 'Reservas' }).click();
    await page.getByRole('button', { name: 'Añadir Reserva' }).click();
    await page.getByRole('textbox', { name: 'Fecha (YYYY-MM-DD)' }).click();
    await page.getByRole('textbox', { name: 'Fecha (YYYY-MM-DD)' }).fill('2025-05-15');
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).fill('12:34');
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).fill('13:34');
    await page.getByRole('textbox', { name: 'Cliente' }).click();
    await page.getByRole('textbox', { name: 'Cliente' }).fill('cliente');
    await page.getByRole('textbox', { name: 'Teléfono' }).click();
    await page.getByRole('textbox', { name: 'Teléfono' }).fill('1123456789');
    await page.getByRole('textbox', { name: 'Descripción' }).click();
    await page.getByRole('textbox', { name: 'Descripción' }).fill('descripcion');
    await page.getByRole('button', { name: 'Guardar Reserva' }).click();
    await expect(page.getByText('Reserva añadida con éxito')).toContainText('Reserva añadida con éxito');
    await page.reload();
    await page.getByRole('gridcell', { name: ':00 - 10:00 Reserva' }).locator('a').click();
    await expect(page.getByText('Cliente: cliente')).toContainText('Cliente: cliente');
    await expect(page.getByText('Teléfono:')).toContainText('Teléfono: 1123456789');
    await expect(page.getByText('Horario: 12:34 - 13:')).toContainText('Horario: 12:34 - 13:34');
    await expect(page.getByText('Descripción: descripcion')).toContainText('Descripción: descripcion');
    await page.getByRole('button', { name: 'Cerrar' }).click();
});

/*
Este test no funcion por lo mismo que el de arriba
y ademas te permite poner cualquier fecha (2025-15-05 en yyyy-mm-dd)
*/
test('añadir reserva error', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('button', { name: 'Reservas' }).click();
    await page.getByRole('button', { name: 'Añadir Reserva' }).click();
    await page.getByRole('button', { name: 'Guardar Reserva' }).click();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByText('Fecha, hora de inicio y hora')).toContainText('Fecha, hora de inicio y hora');
    await page.getByRole('button', { name: 'Añadir Reserva' }).click();
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).fill('09:00');
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).fill('09:30');
    await page.getByRole('button', { name: 'Guardar Reserva' }).click();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByText('La duración debe ser de 60')).toContainText('La duración debe ser de 60');
    await page.getByRole('button', { name: 'Añadir Reserva' }).click();
    await page.getByRole('textbox', { name: 'Fecha (YYYY-MM-DD)' }).click();
    await page.getByRole('textbox', { name: 'Fecha (YYYY-MM-DD)' }).fill('2025-05-15');
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).fill('10:00');
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).fill('09:00');
    await page.getByRole('button', { name: 'Guardar Reserva' }).click();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByText('La duración debe ser de 60')).toContainText('La duración debe ser de 60');
    await page.getByRole('button', { name: 'Añadir Reserva' }).click();
    await page.getByRole('textbox', { name: 'Fecha (YYYY-MM-DD)' }).click();
    await page.getByRole('textbox', { name: 'Fecha (YYYY-MM-DD)' }).fill('2025-15-15');
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).fill('09:00');
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).fill('10:00');
    await page.getByRole('button', { name: 'Guardar Reserva' }).click();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByText('La fecha debe ser una fecha valida')).toContainText('La fecha debe ser una fecha valida');
    await page.getByRole('button', { name: 'Añadir Reserva' }).click();
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).fill('07:00');
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).fill('08:00');
    await page.getByRole('button', { name: 'Guardar Reserva' }).click();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByText('El horario no coincide con un')).toContainText('El horario no coincide con un');
    await page.getByRole('button', { name: 'Añadir Reserva' }).click();
    await page.getByRole('textbox', { name: 'Fecha (YYYY-MM-DD)' }).click();
    await page.getByRole('textbox', { name: 'Fecha (YYYY-MM-DD)' }).fill('2025-05-15');
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).fill('07:45');
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).fill('08:45');
    await page.getByRole('button', { name: 'Guardar Reserva' }).click();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByText('El horario no coincide con un')).toContainText('El horario no coincide con un');
    await page.getByRole('button', { name: 'Añadir Reserva' }).click();
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Inicio (HH:MM)' }).fill('17:45');
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).click();
    await page.getByRole('textbox', { name: 'Hora de Fin (HH:MM)' }).fill('18:45');
    await page.getByRole('textbox', { name: 'Fecha (YYYY-MM-DD)' }).click();
    await page.getByRole('textbox', { name: 'Fecha (YYYY-MM-DD)' }).fill('2025-15-05');
    await page.getByRole('button', { name: 'Guardar Reserva' }).click();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByText('El horario no coincide con un')).toContainText('El horario no coincide con un');
    await page.getByRole('button', { name: 'Cancelar' }).click();
});