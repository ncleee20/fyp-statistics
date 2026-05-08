import { useState } from 'react'
import { C } from '../lib/constants'
import { saveUsers } from '../lib/store'

export default function UserManagement({ users, setUsers, currentUser }) {
  const [showAdd,setShowAdd]=useState(false)
  const [newUser,setNewUser]=useState({name:'',username:'',password:'',role:'viewer'})
  const [formErr,setFormErr]=useState('')
  const [editId,setEditId]=useState(null)
  const [editPass,setEditPass]=useState('')
  const [confirmDel,setConfirmDel]=useState(null)

  const persist=(updated)=>{setUsers(updated);saveUsers(updated)}
  const addUser=()=>{
    if(!newUser.name.trim()||!newUser.username.trim()||!newUser.password.trim()){setFormErr('All fields required.');return}
    if(users.find(u=>u.username===newUser.username.trim())){setFormErr('Username already exists.');return}
    persist([...users,{id:Date.now().toString(),...newUser,username:newUser.username.trim(),createdAt:new Date().toISOString().split('T')[0]}])
    setNewUser({name:'',username:'',password:'',role:'viewer'});setFormErr('');setShowAdd(false)
  }
  const deleteUser=(id)=>{if(id===currentUser.id)return;persist(users.filter(u=>u.id!==id));setConfirmDel(null)}
  const updatePass=(id)=>{if(!editPass.trim())return;persist(users.map(u=>u.id===id?{...u,password:editPass}:u));setEditId(null);setEditPass('')}
  const toggleRole=(id,role)=>{if(id===currentUser.id)return;persist(users.map(u=>u.id===id?{...u,role:role==='admin'?'viewer':'admin'}:u))}

  return (
    <div className="fade-in">
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 className="serif" style={{fontSize:36,fontWeight:400,marginBottom:4}}>User Management</h1>
          <p style={{color:C.muted,fontSize:11,letterSpacing:2,textTransform:'uppercase'}}>{users.length} accounts · Admin only</p>
        </div>
        <button className="btn-primary" onClick={()=>setShowAdd(s=>!s)}>+ Add User</button>
      </div>
      {showAdd&&(
        <div className="card slide-up" style={{padding:24,marginBottom:24}}>
          <div style={{fontSize:11,color:C.muted,letterSpacing:2,textTransform:'uppercase',marginBottom:18}}>New User</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            {[['Full Name','name','Jane Doe'],['Username','username','janedoe'],['Password','password','password']].map(([label,key,ph])=>(
              <div key={key}>
                <label style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:'uppercase',display:'block',marginBottom:6}}>{label}</label>
                <input className="input-field" placeholder={ph} value={newUser[key]} onChange={e=>setNewUser(u=>({...u,[key]:e.target.value}))}/>
              </div>
            ))}
            <div>
              <label style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:'uppercase',display:'block',marginBottom:6}}>Role</label>
              <div style={{display:'flex',gap:8,paddingTop:4}}>
                {['viewer','admin'].map(r=><button key={r} className={`chip ${newUser.role===r?'active':''}`} onClick={()=>setNewUser(u=>({...u,role:r}))}>{r}</button>)}
              </div>
            </div>
          </div>
          {formErr&&<div style={{color:C.danger,fontSize:12,marginBottom:12}}>{formErr}</div>}
          <div style={{display:'flex',gap:10}}>
            <button className="btn-primary" onClick={addUser}>Create Account</button>
            <button className="btn-outline" onClick={()=>{setShowAdd(false);setFormErr('')}}>Cancel</button>
          </div>
        </div>
      )}
      <div className="card" style={{overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1.5fr auto',gap:16,padding:'12px 20px',borderBottom:`1px solid ${C.border}`,background:C.bgLight}}>
          {['Name','Username','Role','Created','Password',''].map((h,i)=><div key={i} style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:'uppercase'}}>{h}</div>)}
        </div>
        {users.map((u,i)=>(
          <div key={u.id} style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1.5fr auto',gap:16,padding:'14px 20px',borderBottom:i<users.length-1?`1px solid ${C.border}`:'none',alignItems:'center'}}>
            <div><div style={{fontWeight:500,fontSize:13}}>{u.name}</div>{u.id===currentUser.id&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>← you</div>}</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:'monospace'}}>@{u.username}</div>
            <div><button onClick={()=>toggleRole(u.id,u.role)} disabled={u.id===currentUser.id} className={u.role==='admin'?'tag-admin':'tag-viewer'} style={{cursor:u.id===currentUser.id?'default':'pointer',border:'none',fontFamily:"'Jost',sans-serif"}}>{u.role}</button></div>
            <div style={{fontSize:11,color:C.muted}}>{u.createdAt||'—'}</div>
            <div>{editId===u.id?(
              <div style={{display:'flex',gap:6}}>
                <input className="input-field" type="text" placeholder="New password" value={editPass} onChange={e=>setEditPass(e.target.value)} style={{padding:'5px 8px',fontSize:12}}/>
                <button className="btn-primary" onClick={()=>updatePass(u.id)} style={{padding:'5px 10px',fontSize:10}}>Save</button>
                <button className="btn-outline" onClick={()=>{setEditId(null);setEditPass('')}} style={{padding:'5px 10px',fontSize:10}}>✕</button>
              </div>
            ):<button className="btn-outline" onClick={()=>setEditId(u.id)} style={{padding:'5px 12px',fontSize:10}}>Change</button>}</div>
            <div>{u.id!==currentUser.id&&(confirmDel===u.id?(
              <div style={{display:'flex',gap:6}}>
                <button className="btn-danger" onClick={()=>deleteUser(u.id)} style={{padding:'5px 10px'}}>Confirm</button>
                <button className="btn-outline" onClick={()=>setConfirmDel(null)} style={{padding:'5px 10px',fontSize:10}}>✕</button>
              </div>
            ):<button className="btn-danger" onClick={()=>setConfirmDel(u.id)} style={{padding:'5px 12px',fontSize:10}}>Remove</button>)}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:16,fontSize:11,color:C.muted}}>· Click a role badge to toggle Admin ↔ Viewer &nbsp;·&nbsp; You cannot remove your own account</div>
    </div>
  )
}
