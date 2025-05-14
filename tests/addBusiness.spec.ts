import { test, expect } from '@playwright/test';

test('Add business happy', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('banner').getByRole('button').nth(3).click();
    await page.getByRole('menuitem', { name: 'Agregar Negocio' }).click();
    await page.getByRole('button', { name: 'Guardar Negocio' }).click();
    await expect(page.getByText('Nombre y número de teléfono')).toContainText('Nombre y número de teléfono');
    await page.getByRole('textbox', { name: 'Nombre del Negocio' }).click();
    await page.getByRole('textbox', { name: 'Nombre del Negocio' }).fill('hola');
    await page.getByRole('textbox', { name: 'Número de Teléfono' }).click();
    await page.getByRole('textbox', { name: 'Número de Teléfono' }).fill('123');
    await page.getByRole('button', { name: 'Guardar Negocio' }).click();
    await page.getByRole('banner').getByRole('button').nth(3).click();
    await page.locator('.MuiBackdrop-root').click();
    await page.reload();
    await page.getByRole('banner').getByRole('button').nth(3).click();
    await page.getByRole('menuitem', { name: 'hola' }).click();
});