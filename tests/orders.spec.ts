import { test, expect } from '@playwright/test';

test('orders happy', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/orders');
    await page.getByRole('button', { name: 'Pedidos' }).click();
    await page.getByRole('textbox', { name: 'Mensaje Pedido Recibido' }).click();
    await page.getByRole('textbox', { name: 'Mensaje Pedido Recibido' }).fill('Tu pedido ha sido recibido, te avisaremos ');
    await page.getByRole('button', { name: 'Guardar Mensajes' }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Nuevo Pedido' }).click();
    await expect(page.getByText('Error al registrar pedido')).toContainText('Error al registrar pedido');
    await page.getByRole('button', { name: 'Ver Detalles' }).first().click();
    await page.getByText('Cliente: Desconocido').click();
    await page.getByText('Teléfono: 541165353178@c.us').click();
    await expect(page.getByRole('paragraph').filter({ hasText: '• Pizza Napolitana - Cantidad:' })).toContainText('• Pizza Napolitana - Cantidad:');
    await expect(page.getByRole('paragraph').filter({ hasText: '• Pizza Mozzarella - Cantidad:' })).toContainText('• Pizza Mozzarella - Cantidad:');
    await expect(page.getByRole('paragraph').filter({ hasText: '• Pizza Jamón Crudo y Rúcula' })).toContainText('• Pizza Jamón Crudo y Rúcula');
});