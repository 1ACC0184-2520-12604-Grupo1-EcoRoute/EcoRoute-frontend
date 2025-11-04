import { useEffect, useMemo, useState } from "react";
import "./TradeDashboard.css";

export default function ProfilePage(){
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const token = useMemo(()=> localStorage.getItem("token") ?? "", []);
    const [saved, setSaved] = useState<string | null>(null);

    useEffect(()=>{
        // Si tienes endpoint para el perfil, aquí se podría cargar.
        // Por ahora, usamos placeholders y si hay token lo mostramos como chip.
        setUsername("usuario_demo");
        setEmail("demo@ecoroute.app");
    },[]);

    const save = () => {
        // Placeholder de guardado local
        setSaved("Preferencias guardadas localmente.");
        setTimeout(()=> setSaved(null), 1400);
    };

    const logout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <section className="page">
            <h1 className="page__title">Perfil</h1>
            <p className="page__subtitle">Configura tu cuenta y preferencias de visualización.</p>

            <div className="grid grid--2">
                <div className="card">
                    <div className="panel">
                        <div className="panel__title">Datos de la cuenta</div>
                    </div>
                    <div className="form">
                        <div className="row">
                            <input className="input" placeholder="Usuario" value={username} onChange={(e)=>setUsername(e.target.value)} />
                            <input className="input" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
                        </div>
                        <div className="row">
                            <button className="btn" onClick={save}>Guardar</button>
                            <button className="btn btn--ghost" onClick={logout}>Cerrar sesión</button>
                        </div>
                        {saved && <div className="msg msg--ok">{saved}</div>}
                    </div>
                </div>

                <div className="card">
                    <div className="panel">
                        <div className="panel__title">Sesión</div>
                    </div>
                    <div className="chips">
                        {token
                            ? <span className="chip">Token presente: {token.slice(0,16)}…</span>
                            : <span className="chip">Sin token (debes iniciar sesión)</span>
                        }
                        <span className="chip">Tema: Oscuro</span>
                        <span className="chip">Idioma: ES</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
