import { test, expect } from '@playwright/test';

test('index happy', async ({ page }) => {
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

test('index basic happy', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('banner').getByRole('button').nth(3).click();
    await page.getByRole('menuitem', { name: 'hola' }).click();
    await page.getByRole('textbox', { name: 'Nombre del Negocio' }).click();
    await page.getByRole('textbox', { name: 'Nombre del Negocio' }).fill('Pizzeria');
    await page.getByRole('textbox', { name: 'Especifique el Tipo de Negocio' }).click();
    await page.getByRole('textbox', { name: 'Especifique el Tipo de Negocio' }).fill('hola');
    await page.getByRole('textbox', { name: 'Localidad' }).click();
    await page.getByRole('textbox', { name: 'Localidad' }).fill('Buenos Aires ciudad');
    await page.getByRole('textbox', { name: 'Dirección' }).click();
    await page.getByRole('textbox', { name: 'Dirección' }).fill('Amenedo 1480aa');
    await page.getByRole('button', { name: 'GUARDAR CAMBIOS' }).click();
    await expect(page.getByText('Configuración guardada con é')).toContainText('Configuración guardada con éxito');
    await page.reload();
    await page.getByRole('banner').getByRole('button').nth(3).click();
    await page.getByRole('menuitem', { name: 'Pizzeria' }).click();
    await expect(page.getByRole('textbox', { name: 'Nombre del Negocio' })).toHaveValue('Pizzeria');
    await expect(page.getByRole('textbox', { name: 'Especifique el Tipo de Negocio' })).toHaveValue('hola');
    await expect(page.getByRole('textbox', { name: 'Localidad' })).toHaveValue('Buenos Aires ciudad');
    await expect(page.getByRole('textbox', { name: 'Dirección' })).toHaveValue('Amenedo 1480aa');
});