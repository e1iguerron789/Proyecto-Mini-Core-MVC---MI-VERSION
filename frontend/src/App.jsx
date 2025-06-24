import { useState, useEffect } from 'react'
import './App.css'
import commissionService from './services/commissionService'
import { formatCurrency, formatPercentage } from './utils/formatUtils'
import { formatDate, formatDateForAPI, getCurrentMonthRange, toInputDate } from './utils/dateUtils'

function App() {
  const [activeTab, setActiveTab] = useState('ventas')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [ventas, setVentas] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [nuevaVenta, setNuevaVenta] = useState({
    vendedor: '',
    fecha_venta: '',
    monto: ''
  })
  
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [comisiones, setComisiones] = useState(null)
  const [expandedVendedores, setExpandedVendedores] = useState(new Set()) // Para múltiples vendedores expandidos
  
  useEffect(() => {
    cargarDatos()
    const rangoMes = getCurrentMonthRange()
    setFechaInicio(rangoMes.start)
    setFechaFin(rangoMes.end)
  }, [])
  
  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [ventasData, vendedoresData] = await Promise.all([
        commissionService.getVentas(),
        commissionService.getVendedores()
      ])
      setVentas(ventasData)
      setVendedores(vendedoresData)
    } catch (error) {
      showMessage('danger', 'Error al cargar datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleSubmitVenta = async (e) => {
    e.preventDefault()
    
    if (!nuevaVenta.vendedor || !nuevaVenta.fecha_venta || !nuevaVenta.monto) {
      showMessage('warning', 'Por favor completa todos los campos')
      return
    }
    
    setLoading(true)
    try {
      await commissionService.crearVenta({
        vendedor: parseInt(nuevaVenta.vendedor),
        fecha_venta: nuevaVenta.fecha_venta,
        monto: parseFloat(nuevaVenta.monto)
      })
      
      setNuevaVenta({ vendedor: '', fecha_venta: '', monto: '' })
      await cargarDatos()
      showMessage('success', 'Venta creada exitosamente')
    } catch (error) {
      showMessage('danger', 'Error al crear venta: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const eliminarVenta = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta venta?')) return
    
    setLoading(true)
    try {
      await commissionService.eliminarVenta(id)
      await cargarDatos()
      showMessage('success', 'Venta eliminada exitosamente')
    } catch (error) {
      showMessage('danger', 'Error al eliminar venta: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const calcularComisiones = async () => {
    if (!fechaInicio || !fechaFin) {
      showMessage('warning', 'Por favor selecciona un rango de fechas')
      return
    }
    
    setLoading(true)
    try {
      const resultado = await commissionService.calcularComisiones(fechaInicio, fechaFin)
      setComisiones(resultado)
      setExpandedVendedores(new Set()) // Cerrar todos los dropdowns al recalcular
      showMessage('success', 'Comisiones calculadas exitosamente')
    } catch (error) {
      showMessage('danger', 'Error al calcular comisiones: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleVendedorDropdown = (vendedorId) => {
    const newExpanded = new Set(expandedVendedores)
    if (newExpanded.has(vendedorId)) {
      newExpanded.delete(vendedorId)
    } else {
      newExpanded.add(vendedorId)
    }
    setExpandedVendedores(newExpanded)
  }

  return (
    <div className="App">
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="d-flex justify-between align-center">
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
              Sistema de Comisiones - Proyecto Mini Core
            </h1>
            <nav className="nav">
              <button 
                className={`nav-link ${activeTab === 'ventas' ? 'active' : ''}`}
                onClick={() => setActiveTab('ventas')}
              >
                💰 Gestión de Ventas
              </button>
              <button 
                className={`nav-link ${activeTab === 'comisiones' ? 'active' : ''}`}
                onClick={() => setActiveTab('comisiones')}
              >
                📈 Cálculo de Comisiones
              </button>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="app-main">
          {/* Messages */}
          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Tab: Gestión de Ventas */}
          {activeTab === 'ventas' && (
            <>
              {/* Formulario para nueva venta */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">➕ Agregar Nueva Venta</h2>
                </div>
                
                <form onSubmit={handleSubmitVenta}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Vendedor</label>
                      <select 
                        className="form-select"
                        value={nuevaVenta.vendedor}
                        onChange={(e) => setNuevaVenta({...nuevaVenta, vendedor: e.target.value})}
                      >
                        <option value="">Seleccionar vendedor...</option>
                        {vendedores.map(vendedor => (
                          <option key={vendedor.id} value={vendedor.id}>
                            {vendedor.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Fecha de Venta</label>
                      <input 
                        type="date"
                        className="form-input"
                        value={nuevaVenta.fecha_venta}
                        onChange={(e) => setNuevaVenta({...nuevaVenta, fecha_venta: e.target.value})}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Monto</label>
                      <input 
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        value={nuevaVenta.monto}
                        onChange={(e) => setNuevaVenta({...nuevaVenta, monto: e.target.value})}
                      />
                    </div>
                    
                    <div className="form-group">
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? '⏳ Guardando...' : '💾 Guardar Venta'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Lista de ventas */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">📋 Lista de Ventas</h2>
                </div>
                
                {loading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    <span style={{ marginLeft: '10px' }}>Cargando...</span>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Vendedor</th>
                          <th>Fecha</th>
                          <th>Monto</th>
                          <th>Comisión</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventas.map(venta => (
                          <tr key={venta.id}>
                            <td>{venta.id}</td>
                            <td>{venta.vendedor_nombre}</td>
                            <td>{formatDate(venta.fecha_venta)}</td>
                            <td className="text-success">{formatCurrency(venta.monto)}</td>
                            <td className="text-warning">
                              {formatCurrency(venta.comision_calculada.monto)} 
                              <small className="text-muted">
                                ({formatPercentage(venta.comision_calculada.porcentaje)})
                              </small>
                            </td>
                            <td>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => eliminarVenta(venta.id)}
                                disabled={loading}
                              >
                                🗑️ Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                        {ventas.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center text-muted">
                              No hay ventas registradas
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tab: Cálculo de Comisiones */}
          {activeTab === 'comisiones' && (
            <>
              {/* Filtros de fecha */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">📅 Calcular Comisiones por Rango de Fechas</h2>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fecha Inicio</label>
                    <input 
                      type="date"
                      className="form-input"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Fecha Fin</label>
                    <input 
                      type="date"
                      className="form-input"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <button 
                      className="btn btn-primary"
                      onClick={calcularComisiones}
                      disabled={loading}
                    >
                      {loading ? '⏳ Calculando...' : '🧮 Calcular Comisiones'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Resultados de comisiones */}
              {comisiones && (
                <>
                  {/* Resumen general */}
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">
                        📊 Resumen de Comisiones 
                        <small className="text-muted">
                          ({comisiones.periodo_info?.fecha_inicio_formateada} - {comisiones.periodo_info?.fecha_fin_formateada})
                        </small>
                      </h2>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: 'var(--spacing-md)', 
                      marginBottom: 'var(--spacing-lg)',
                      padding: 'var(--spacing-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div className="text-center">
                        <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent-emphasis)' }}>
                          {comisiones.total_vendedores}
                        </div>
                        <div className="text-muted">Vendedores</div>
                      </div>
                      <div className="text-center">
                        <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--success)' }}>
                          {comisiones.total_ventas}
                        </div>
                        <div className="text-muted">Ventas</div>
                      </div>
                      <div className="text-center">
                        <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--warning)' }}>
                          {formatCurrency(comisiones.total_monto_ventas)}
                        </div>
                        <div className="text-muted">Total Ventas</div>
                      </div>
                      <div className="text-center">
                        <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--info)' }}>
                          {formatCurrency(comisiones.total_comisiones)}
                        </div>
                        <div className="text-muted">Total Comisiones</div>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown de comisiones por vendedor - Estilo como tu ejemplo */}
                  <div className="card">
                    <div className="card-header">
                      <h2 className="card-title">💰 Comisiones por Vendedor</h2>
                      <p className="text-muted mb-0">Haz clic en un vendedor para ver el detalle de sus comisiones individuales</p>
                    </div>
                    
                    {/* Lista de vendedores con dropdown */}
                    <div style={{ padding: 'var(--spacing-md)' }}>
                      {comisiones.vendedores.map(vendedor => (
                        <div key={vendedor.vendedor_id} style={{ marginBottom: 'var(--spacing-sm)' }}>
                          {/* Fila principal del vendedor - Similar a tu ejemplo */}
                          <div 
                            onClick={() => toggleVendedorDropdown(vendedor.vendedor_id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: 'var(--spacing-md)',
                              backgroundColor: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-default)',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)',
                              marginBottom: expandedVendedores.has(vendedor.vendedor_id) ? '0' : 'var(--spacing-xs)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = 'var(--bg-overlay)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'var(--bg-tertiary)'
                            }}
                          >
                            {/* Indicador de expansión */}
                            <span style={{ 
                              marginRight: 'var(--spacing-md)', 
                              fontSize: '1.2rem',
                              transition: 'transform var(--transition-fast)',
                              transform: expandedVendedores.has(vendedor.vendedor_id) ? 'rotate(90deg)' : 'rotate(0deg)'
                            }}>
                              ▶
                            </span>
                            
                            {/* Información del vendedor */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                {vendedor.vendedor_nombre}
                              </div>
                              <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
                                <div className="text-center">
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ventas</div>
                                  <div style={{ fontWeight: 600 }}>{vendedor.total_ventas}</div>
                                </div>
                                <div className="text-center">
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Vendido</div>
                                  <div style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(vendedor.total_monto_ventas)}</div>
                                </div>
                                <div className="text-center">
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Comisiones</div>
                                  <div style={{ fontWeight: 600, color: 'var(--warning)' }}>{formatCurrency(vendedor.total_comisiones)}</div>
                                </div>
                                <div className="text-center">
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>% Promedio</div>
                                  <div style={{ fontWeight: 600, color: 'var(--info)' }}>{formatPercentage(vendedor.porcentaje_promedio)}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Dropdown expandible con las comisiones individuales */}
                          {expandedVendedores.has(vendedor.vendedor_id) && (
                            <div style={{
                              border: '1px solid var(--border-default)',
                              borderTop: 'none',
                              borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                              backgroundColor: 'var(--bg-secondary)',
                              overflow: 'hidden'
                            }}>
                              {vendedor.comisiones_individuales && vendedor.comisiones_individuales.length > 0 ? (
                                <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                                  <table className="table" style={{ margin: 0 }}>
                                    <thead>
                                      <tr style={{ backgroundColor: 'var(--bg-overlay)' }}>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>ID</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Fecha</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Monto Venta</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>% Aplicado</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Comisión</th>
                                        <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Regla</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {vendedor.comisiones_individuales.map(comision => (
                                        <tr key={`${vendedor.vendedor_id}-${comision.id}`}>
                                          <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontWeight: 600, fontSize: '0.9rem' }}>#{comision.id}</td>
                                          <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.9rem' }}>{comision.fecha}</td>
                                          <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.9rem', color: 'var(--success)' }}>{formatCurrency(comision.monto_venta)}</td>
                                          <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.9rem', color: 'var(--info)' }}>{formatPercentage(comision.porcentaje_aplicado)}</td>
                                          <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.9rem', color: 'var(--warning)', fontWeight: 600 }}>{formatCurrency(comision.monto_comision)}</td>
                                          <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {comision.regla_aplicada?.descripcion || 'Sin regla'}
                                          </td>
                                        </tr>
                                      ))}
                                      {/* Fila de totales */}
                                      <tr style={{ 
                                        backgroundColor: 'var(--bg-tertiary)', 
                                        borderTop: '2px solid var(--border-default)',
                                        fontWeight: 600
                                      }}>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }} colSpan="2">TOTAL</td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', color: 'var(--success)' }}>{formatCurrency(vendedor.total_monto_ventas)}</td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', color: 'var(--info)' }}>{formatPercentage(vendedor.porcentaje_promedio)}</td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', color: 'var(--warning)' }}>{formatCurrency(vendedor.total_comisiones)}</td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', color: 'var(--text-muted)' }}>{vendedor.total_ventas} ventas</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div style={{ 
                                  padding: 'var(--spacing-lg)', 
                                  textAlign: 'center', 
                                  color: 'var(--text-muted)' 
                                }}>
                                  No hay comisiones individuales para este vendedor en el período seleccionado
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App