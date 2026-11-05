import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [session, setSession] = useState(null)
  const [message, setMessage] = useState('')


 useEffect(() => {
  const {
    data: { subscription: authSubscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session)

    if (session) {
      loadCustomers()
    } else {
      setCustomers([])
    }
  })

  const customersChannel = supabase
    .channel('customers-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'customers',
      },
      () => {
        loadCustomers()
      },
    )
    .subscribe()

  return () => {
    authSubscription.unsubscribe()
    supabase.removeChannel(customersChannel)
  }
}, [])


async function loadCustomers() {
  setLoading(true)
  setErrorMessage('')

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq("status", "Active")
    .order('company_name')

  if (error) {
    console.error(error)
    setErrorMessage(error.message)
  } else {
    setCustomers(data ?? [])
  }

  setLoading(false)
}


async function signUp() {
  const { error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    setMessage(error.message)
  }
  else {
    setMessage("User created successfully.")
  }
}



async function signIn() {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    setMessage(error.message)
  }
  else {
    setMessage("Successfully signed in.")
  }
}


async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    setMessage(error.message)
  } else {
    setSession(null)
    setMessage('Successfully signed out.')
  }
}




async function uploadFile(event) {
  const file = event.target.files[0]

  if (!file) return

  const { error } = await supabase.storage
    .from('customer-files')
    .upload(file.name, file)

  if (error) {
    setMessage(error.message)
  } else {
    setMessage('File uploaded successfully.')
  }
}



async function downloadFile(fileName) {
  const { data, error } = await supabase.storage
    .from('customer-files')
    .createSignedUrl(fileName, 60)

  if (error) {
    setMessage(error.message)
    return
  }

  window.open(data.signedUrl, '_blank')
}





  return (
    <main>
      <h1>Customer Solutions Dashboard</h1>
      <p>Customers loaded from Supabase PostgreSQL</p>

      {loading && <p>Loading customers...</p>}

      {errorMessage && (
        <p>
          Error loading customers: {errorMessage}
        </p>
      )}

      {!loading && !errorMessage && customers.length === 0 && (
        <p>No customers found.</p>
      )}

      {!loading && !errorMessage && customers.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Country</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.company_name}</td>
                <td>{customer.contact_name}</td>
                <td>{customer.status}</td>
                <td>{customer.country}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}


<h1>Supabase Authentication Demo</h1>

<input
    placeholder="Email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
/>

<br /><br />

<input
    type="password"
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
/>

<br /><br />

<button onClick={signUp}>
    Sign Up
</button>

<button onClick={signIn}>
  Sign In
</button>


<button onClick={signOut}>
  Sign Out
</button>

<p>
  {session
    ? `Logged in as: ${session.user.email}`
    : "Not logged in"}
</p>

<br /><br />

<input
  type="file"
  onChange={uploadFile}
/>
<br />

<button onClick={() => downloadFile('ChatGPT Image Aug 3, 2026, 09_15_18 PM.png')}>
  Download File
</button>





<p>{message}</p>

    </main>
  )
}

export default App