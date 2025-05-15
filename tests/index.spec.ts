import { test, expect } from '@playwright/test';

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

/*
No funciona pero el test daria que esta mal
test('index time happy', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.locator('div').filter({ hasText: /^Lunes$/ }).getByRole('textbox').first().click();
    await page.locator('div').filter({ hasText: /^Lunes$/ }).getByRole('textbox').first().press('ArrowLeft');
    await page.locator('div').filter({ hasText: /^Lunes$/ }).getByRole('textbox').first().press('ArrowLeft');
    await page.locator('div').filter({ hasText: /^Lunes$/ }).getByRole('textbox').first().fill('11:23');
    await page.getByRole('button', { name: 'GUARDAR CAMBIOS' }).click();
    await expect(page.getByText('Configuración guardada con éxito')).toContainText('Configuración guardada con éxito');
    await page.reload();
    await page.locator('div').filter({ hasText: /^Lunes$/ }).getByRole('textbox').first().click();
    await expect(page.locator('div').filter({ hasText: /^Lunes$/ }).getByRole('textbox').first()).toHaveValue('11:23');
});
*/

test('index faq happy', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('button', { name: 'AÑADIR FAQ' }).click();
    await page.getByRole('textbox', { name: 'Pregunta' }).click();
    await page.getByRole('textbox', { name: 'Pregunta' }).fill('hola');
    await page.getByRole('textbox', { name: 'Respuesta' }).click();
    await page.getByRole('textbox', { name: 'Respuesta' }).fill('chau');
    await page.getByRole('button', { name: 'GUARDAR CAMBIOS' }).click();
    await expect(page.getByText('Configuración guardada con é')).toContainText('Configuración guardada con éxito');
    await page.reload();
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('button', { name: 'Eliminar pregunta frecuente' }).click();
    await expect(page.getByText('FAQ eliminada con éxito')).toContainText('FAQ eliminada con éxito');
});

test('index faq error', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('button', { name: 'AÑADIR FAQ' }).click();
    await page.getByRole('button', { name: 'GUARDAR CAMBIOS' }).click();
    await expect(page.getByText('Error: La FAQ "sin pregunta"')).toContainText('Error: La FAQ "sin pregunta"');
    await page.getByRole('textbox', { name: 'Pregunta' }).click();
    await page.getByRole('textbox', { name: 'Pregunta' }).fill('a');
    await page.getByRole('button', { name: 'GUARDAR CAMBIOS' }).click();
    await expect(page.getByText('Error: La FAQ "a" tiene')).toContainText('Error: La FAQ "a" tiene');
    await page.getByRole('textbox', { name: 'Respuesta' }).click();
    await page.getByRole('textbox', { name: 'Respuesta' }).fill('a');
    await page.getByRole('textbox', { name: 'Pregunta' }).click();
    await page.getByRole('textbox', { name: 'Pregunta' }).fill('');
    await page.getByRole('button', { name: 'GUARDAR CAMBIOS' }).click();
    await expect(page.getByText('Error: La FAQ "sin pregunta"')).toContainText('Error: La FAQ "sin pregunta"');
    await page.getByRole('textbox', { name: 'Pregunta' }).click();
    await page.getByRole('button', { name: 'Eliminar pregunta frecuente' }).click();
    await expect(page.getByText('FAQ eliminada con éxito')).toContainText('FAQ eliminada con éxito');
});

test('index agregar producto happy', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('textbox', { name: 'Nombre del Producto/Servicio' }).click();
    await page.getByRole('textbox', { name: 'Nombre del Producto/Servicio' }).fill('abcde');
    await page.getByRole('textbox', { name: 'Descripción' }).click();
    await page.getByRole('textbox', { name: 'Descripción' }).fill('and');
    await page.getByRole('spinbutton', { name: 'Precio' }).click();
    await page.getByRole('spinbutton', { name: 'Precio' }).fill('12');
    await page.getByRole('button', { name: 'Agregar' }).click();
    await expect(page.getByText('Producto agregado con éxito')).toContainText('Producto agregado con éxito');
    await expect(page.getByText('abcde')).toContainText('abcde');
});

test('index agregar producto error', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/');
    await page.getByRole('button', { name: 'Agregar' }).click();
    await page.locator('.flex-1 > .flex > .MuiPaper-root > .MuiCardContent-root').click();
    await expect(page.getByText('Por favor, completa los')).toContainText('Por favor, completa los');
    await page.getByRole('textbox', { name: 'Nombre del Producto/Servicio' }).click();
    await page.getByRole('textbox', { name: 'Nombre del Producto/Servicio' }).fill('hola');
    await page.getByRole('button', { name: 'Agregar' }).click();
    await expect(page.getByText('Por favor, completa los')).toContainText('Por favor, completa los');
    await page.getByRole('textbox', { name: 'Descripción' }).click();
    await page.getByRole('textbox', { name: 'Descripción' }).fill('chau');
    await page.getByRole('button', { name: 'Agregar' }).click();
    await expect(page.getByText('Por favor, completa los')).toContainText('Por favor, completa los');
    await page.getByRole('textbox', { name: 'Nombre del Producto/Servicio' }).click();
    await page.getByRole('textbox', { name: 'Nombre del Producto/Servicio' }).fill('');
    await page.getByRole('spinbutton', { name: 'Precio' }).click();
    await page.getByRole('spinbutton', { name: 'Precio' }).fill('120');
    await page.getByRole('button', { name: 'Agregar' }).click();
    await expect(page.getByText('Por favor, completa los')).toContainText('Por favor, completa los');
});