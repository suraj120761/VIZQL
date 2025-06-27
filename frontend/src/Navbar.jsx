import React from 'react';
import logo from './assets/image.png';

const Navbar = () => {
  return (
    <>
      <div style={styles.navbar}>
        <img src={logo} alt="Logo" style={styles.logo} />
        <span style={styles.title}>VIZQL</span>
      </div>
      {/* Spacer div to push the content down below the fixed navbar */}
      <div style={{ height: '70px' }}></div>
    </>
  );
};

const styles = {
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '70px',
    width: '100%',
    backgroundColor: '#3b00dd',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    padding: '0 1rem',
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
  logo: {
    height: '40px',
    marginRight: '12px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
  },
};

export default Navbar;
