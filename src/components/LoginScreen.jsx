import { useState } from 'react'
import { C } from '../lib/constants'
import { getUsers } from '../lib/store'

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleLogin = () => {
    setError(''); setLoading(true)
    setTimeout(() => {
      const user = getUsers().find(u => u.username === username.trim() && u.password === password)
      if (user) onLogin(user)
      else { setError('Incorrect username or password.'); setLoading(false) }
    }, 500)
  }

  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div className="slide-up" style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div className="serif" style={{fontSize:28,fontWeight:400,letterSpacing:1,marginBottom:4}}>
            <span style={{fontWeight:600}}>FYP</span><span style={{color:C.muted,fontWeight:300}}> STATISTICS</span>
          </div>
          <div style={{fontSize:10,color:C.muted,letterSpacing:3,textTransform:'uppercase'}}>Performance Tracker</div>
        </div>
        <div className="card" style={{padding:36}}>
          <div className="serif" style={{fontSize:22,fontWeight:400,marginBottom:4}}>Welcome back</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:28}}>Sign in to access the dashboard</div>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:'uppercase',display:'block',marginBottom:6}}>Username</label>
            <input className={`input-field ${error?'error':''}`} placeholder="your username" value={username}
              onChange={e=>{setUsername(e.target.value);setError('')}} onKeyDown={e=>e.key==='Enter'&&handleLogin()} autoFocus/>
          </div>
          <div style={{marginBottom:24}}>
            <label style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:'uppercase',display:'block',marginBottom:6}}>Password</label>
            <div style={{position:'relative'}}>
              <input className={`input-field ${error?'error':''}`} placeholder="••••••••" type={showPass?'text':'password'}
                value={password} onChange={e=>{setPassword(e.target.value);setError('')}}
                onKeyDown={e=>e.key==='Enter'&&handleLogin()} style={{paddingRight:44}}/>
              <button onClick={()=>setShowPass(s=>!s)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:C.muted,fontSize:14,cursor:'pointer',padding:4}}>
                {showPass?'🙈':'👁'}
              </button>
            </div>
          </div>
          {error&&<div style={{color:C.danger,fontSize:12,marginBottom:16,padding:'8px 12px',background:'#fdf3f2',borderRadius:6,border:'1px solid #f0ccc8'}}>{error}</div>}
          <button className="btn-primary" onClick={handleLogin} disabled={loading||!username||!password} style={{width:'100%',padding:12,fontSize:12}}>
            {loading?'Signing in…':'Sign In →'}
          </button>
        </div>
        <div style={{textAlign:'center',marginTop:20,fontSize:11,color:C.muted}}>Contact your admin to get access</div>
      </div>
    </div>
  )
}
