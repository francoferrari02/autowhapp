import React, { useState, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import './App.css';
import { FAQ } from './types';

const App: React.FC = () => {
  // Estados para Configuración General
  const [context, setContext] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');

  // Estados para Módulos (ejemplo: Pedidos)
  const [orderMessage, setOrderMessage] = useState<string>('');

  // Estado para Feedback
  const [message, setMessage] = useState<string>('');

  // Módulos contratados (simulado)
  const subscribedModules: string[] = ['Pedidos', 'Análisis en Tiempo Real'];

  // Enviar configuración al webhook
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const configData = {
      context,
      files: files.map(file => file.name), // Solo nombres por ahora
      faqs: [{ question, answer }],
      orderMessage: subscribedModules.includes('Pedidos') ? orderMessage : undefined,
    };
    try {
      const webhookUrl: string = 'http://localhost:5678/webhook-test/guardar-pedido';
      const response = await axios.post(webhookUrl, configData);
      setMessage('Configuración guardada con éxito');
      setContext('');
      setFiles([]);
      setQuestion('');
      setAnswer('');
      setOrderMessage('');
    } catch (error) {
      setMessage('Error al guardar la configuración');
      console.error(error);
    }
  };

  // Manejar subida de archivos
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="App">
      <h1 className="title">AutoWhapp - Dashboard</h1>

      {/* Sección: Configuración General */}
      <section className="dashboard-section">
        <h2 className="section-title">Configuración General</h2>
        <form className="faq-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="label">Contexto del Bot:</label>
            <textarea
              className="textarea"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Ej: Eres el contestador de la pizzería Bongusto en Buenos Aires..."
            />
          </div>
          <div className="input-group">
            <label className="label">Subir Archivos (Menú, Precios, etc.):</label>
            <input
              type="file"
              className="file-input"
              multiple
              onChange={handleFileChange}
            />
            {files.length > 0 && (
              <ul className="file-list">
                {files.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="input-group">
            <label className="label">Pregunta Frecuente:</label>
            <input
              type="text"
              className="input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Escribe la pregunta..."
            />
          </div>
          <div className="input-group">
            <label className="label">Respuesta:</label>
            <input
              type="text"
              className="input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Escribe la respuesta..."
            />
          </div>
        </form>
      </section>

      {/* Sección: Módulos Contratados */}
      <section className="dashboard-section">
        <h2 className="section-title">Módulos Contratados</h2>
        {subscribedModules.map((module) => (
          <div key={module} className="module-card">
            <h3 className="module-title">{module}</h3>
            {module === 'Pedidos' && (
              <div className="input-group">
                <label className="label">Mensaje de Pedido:</label>
                <input
                  type="text"
                  className="input"
                  value={orderMessage}
                  onChange={(e) => setOrderMessage(e.target.value)}
                  placeholder="Ej: Tu pedido ha sido recibido, te avisaremos pronto..."
                />
              </div>
            )}
            {module === 'Análisis en Tiempo Real' && (
              <p className="module-info">Datos en tiempo real disponibles pronto.</p>
            )}
          </div>
        ))}
      </section>

      {/* Botón de Guardar y Feedback */}
      <button type="submit" className="submit-btn" onClick={handleSubmit}>
        Guardar Configuración
      </button>
      {message && (
        <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default App;