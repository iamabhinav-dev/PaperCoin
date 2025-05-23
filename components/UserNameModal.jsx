'use client'
import React, { useState, useEffect } from 'react'
import { XCircle } from 'lucide-react'
import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore' // Update this path to match your project structure

const UserNameModal = ({ isOpen, onClose, initialMode = 'set-username', email }) => {
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Get user and setUser from auth store
  const { user, setUser } = useAuthStore()

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUsername('')
      setUsernameError('')
    }
  }, [isOpen])

  // Handle username input change
  const handleUsernameChange = (e) => {
    const value = e.target.value
    setUsername(value)
    
    // Validate username on change
    if (value.length > 0 && value.length < 3) {
      setUsernameError('Username must be at least 3 characters')
    } else if (value.length > 20) {
      setUsernameError('Username cannot exceed 20 characters')
    } else if (value.length > 0 && !/^[a-zA-Z0-9_]*$/.test(value)) {
      setUsernameError('Username can only contain letters, numbers, and underscores')
    } else {
      setUsernameError('')
    }
  }

  // Check if username is available using the API
  useEffect(() => {
    let timeoutId
    
    const checkUsernameAvailability = async () => {
      try {
        const response = await axios.post('/api/auth/checkIfUserNameExists', { username });
        
        if (response.data.exists) {
          setUsernameError('This username is already taken');
        } else {
          setUsernameError('');
        }
      } catch (error) {
        console.error('Error checking username availability:', error);
        // Don't set error message here to avoid showing errors during typing
      } finally {
        setIsCheckingUsername(false);
      }
    };
    
    if (username.length >= 3 && /^[a-zA-Z0-9_]*$/.test(username)) {
      setIsCheckingUsername(true);
      
      // Add debounce to avoid unnecessary API calls while typing
      timeoutId = setTimeout(() => {
        checkUsernameAvailability();
      }, 500);
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [username])

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (usernameError || !username || username.length < 3) {
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Make API call to set username
      const response = await axios.post('/api/auth/setUserName', {
        email,
        username
      })
      
      // Handle successful response
      if (response.status === 200) {
        // Update user in the auth store with the new username
        if (user) {
          setUser({
            ...user,
            username: username
          });
        }


        
        // Close modal and notify parent component if needed
        onClose(username) // You can modify this to pass the username back if needed
      }
    } catch (error) {
      // Handle error responses
      if (error.response?.data?.message) {
        setUsernameError(error.response.data.message)
      } else {
        setUsernameError('Failed to set username. Please try again.')
      }
      console.error('Error setting username:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't render if modal is not open
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40">
      <div
        className="bg-gray-900 rounded-xl w-full max-w-md p-8 relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <XCircle size={24} />
        </button>
       
        {/* Modal header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-white">Choose Your Username</h2>
          <p className="text-gray-400 mt-2">
            Pick a unique username for your PaperCoin account
          </p>
        </div>
       
        {/* Username form */}
        <form onSubmit={handleSubmit}>
          {/* Username field */}
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-300 mb-2 text-sm">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              className={`w-full bg-gray-800 border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                usernameError ? 'border-red-500' : 'border-gray-700'
              }`}
              placeholder="Enter your username"
              autoComplete="off"
            />
           
            {/* Username validation error */}
            {usernameError && (
              <p className="mt-2 text-red-400 text-sm">{usernameError}</p>
            )}
           
            {/* Username requirements */}
            <div className="mt-2 text-gray-400 text-xs">
              <p>Username requirements:</p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li className={username.length >= 3 ? 'text-green-400' : ''}>
                  At least 3 characters
                </li>
                <li className={username.length <= 20 ? 'text-green-400' : ''}>
                  Maximum 20 characters
                </li>
                <li className={/^[a-zA-Z0-9_]*$/.test(username) ? 'text-green-400' : ''}>
                  Only letters, numbers, and underscores
                </li>
              </ul>
            </div>
          </div>
         
          {/* Loading indicator */}
          {isCheckingUsername && (
            <div className="mb-4 text-amber-500 text-sm flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing your request...
            </div>
          )}
         
          {/* Submit button */}
          <button
            type="submit"
            disabled={isCheckingUsername || !!usernameError || !username || username.length < 3 || isSubmitting}
            className={`w-full font-bold py-3 px-4 rounded-lg transition-colors mb-4 ${
              isCheckingUsername || !!usernameError || !username || username.length < 3 || isSubmitting
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-600 text-black'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Save Username'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default UserNameModal