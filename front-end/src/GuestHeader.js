import './Header.css'
import logo from './fridge.png'
import { Link } from 'react-router-dom'
import React from "react"

/**
 * A React component that is used for the header displayed at the top of every page of the site.
 * @param {*} param0 an object holding any props passed to this component from its parent component
 * @returns The contents of this component, in JSX form.
 */
const GuestHeader = (props) => {

  return (
      <>
    <header className="Header-header">
      <img src = {logo} className = "logo" alt = "ReFreegerator Logo" />
      <h2> <Link to="/UserList" className='Refreegerator'> Refreegerator </Link> </h2>        
    </header>
      </>
  )
}

// make this component available to be imported into any other file
export default GuestHeader
