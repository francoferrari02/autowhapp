import { test, expect } from '@playwright/test';

test('has title autowhapp', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001');
    
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle('AutoWhapp');
});

test('recordatorios happy', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('button', { name: 'Recordatorios' }).click();
    await page.getByRole('textbox', { name: 'Mensaje' }).click();
    await page.getByRole('textbox', { name: 'Mensaje' }).fill('jhjsdfhjhs');
    await page.getByRole('combobox', { name: 'Frecuencia Diario' }).click();
    await page.getByRole('option', { name: 'Diario' }).click();
    await page.getByRole('textbox', { name: 'Horario' }).click();
    await page.getByRole('textbox', { name: 'Horario' }).fill('00:34');
    await page.getByRole('button', { name: 'Añadir recordatorio' }).click();
    await expect(page.getByText('Recordatorio agregado con éxito')).toContainText('Recordatorio agregado con éxito');
    await page.reload();
    await expect(page.locator('#root > div > div > div > div:nth-child(3) > div')).toHaveCount(1);
    await page.locator('.MuiBox-root > button:nth-child(3)').click();
    await page.getByRole('button', { name: 'Eliminar' }).click();
    await page.reload();
    await expect(page.locator('#root > div > div > div > div:nth-child(3) > div')).toHaveCount(0);
});


test('recordatorios empty name', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('button', { name: 'Recordatorios' }).click();
    await page.getByRole('textbox', { name: 'Mensaje' }).click();
    await page.getByRole('combobox', { name: 'Frecuencia Diario' }).click();
    await page.getByRole('option', { name: 'Diario' }).click();
    await page.getByRole('textbox', { name: 'Horario' }).click();
    await page.getByRole('textbox', { name: 'Horario' }).fill('00:34');
    await page.getByRole('button', { name: 'Añadir recordatorio' }).click();
    await expect(page.getByText('El mensaje no puede estar vacío')).toContainText('El mensaje no puede estar vacío');
    await page.reload();
    await expect(page.locator('#root > div > div > div > div:nth-child(3) > div')).toHaveCount(0);
});

test('recordatorios dia invalido', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('button', { name: 'Recordatorios' }).click();
    await page.getByRole('combobox', { name: 'Frecuencia Diario' }).click();
    await page.getByRole('option', { name: 'Mensual' }).click();
    await page.getByRole('spinbutton', { name: 'Día del mes (1-31)' }).click();
    await page.getByRole('spinbutton', { name: 'Día del mes (1-31)' }).fill('40');
    await page.getByRole('textbox', { name: 'Mensaje' }).fill('asdfads');
    await page.getByRole('button', { name: 'Añadir recordatorio' }).click();
    await expect(page.getByText('El día del mes debe ser un número válido entre 1 y 31')).toContainText('El día del mes debe ser un número válido entre 1 y 31');
    await page.reload();
    await expect(page.locator('#root > div > div > div > div:nth-child(3) > div')).toHaveCount(0);
});


test('recordatorios semana dia vacio', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('button', { name: 'Recordatorios' }).click();
    await page.getByRole('combobox', { name: 'Frecuencia Diario' }).click();
    await page.getByRole('option', { name: 'Semanal' }).click();
    await page.getByRole('textbox', { name: 'Mensaje' }).click();
    await page.getByRole('textbox', { name: 'Mensaje' }).fill('hola');
    await page.getByRole('button', { name: 'Añadir recordatorio' }).click();
    await expect(page.getByText('El día de la semana no puede estar vacío')).toContainText('El día de la semana no puede estar vacío');

    await page.reload();
    await expect(page.locator('#root > div > div > div > div:nth-child(3) > div')).toHaveCount(0);
});