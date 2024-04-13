import React, { useState, useEffect } from "react";
import { 
  Button, 
  Flex, 
  Heading, 
  Text, 
  TextField, 
  View, 
  withAuthenticator } from "@aws-amplify/ui-react";
import { getUrl } from 'aws-amplify/storage';
import "@aws-amplify/ui-react/styles.css";
import { listNotes } from "../src/graphql/queries";
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation, updateNote as updateNoteMutation } from "../src/graphql/mutations";
import { generateClient } from "@aws-amplify/api";
import { remove } from 'aws-amplify/storage';
import 'bootstrap/dist/css/bootstrap.min.css';

const client = generateClient();

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);
  const [updatedNoteData, setUpdatedNoteData] = useState({ id: '', name: '', description: '' });

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await client.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const url = await getUrl(note.name);
          note.image = url;
        }
        return note;
      })
    );
    setNotes(notesFromAPI);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const data = {
      name: form.get("name"),
      description: form.get("description"),
    };
  
    await client.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
  }
    
  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await remove(name);
    await client.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  async function updateNote(id) {
    const { name, description } = updatedNoteData;
    const updatedNotes = notes.map(note => {
      if (note.id === id) {
        return { ...note, name, description };
      }
      return note;
    });

    setNotes(updatedNotes);

    await client.graphql({
      query: updateNoteMutation,
      variables: { input: { id, name, description } },
    });

    // Clear the updated note data after update
    setUpdatedNoteData({ id: '', name: '', description: '' });
  }

  return (
    <div className="App d-flex flex-column min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <a className="navbar-brand" href="#">My Notes App</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" href="#">Home</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">About</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">Contact</a>
              </li>
              <li className="nav-item">
                <button className="btn btn-primary" onClick={signOut}>Sign Out</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container flex-grow-1">
        <h1 className="mt-4">My Notes App</h1>
        <form className="mt-4" onSubmit={createNote}>
          <div className="row">
            <div className="col">
              <input type="text" className="form-control" name="name" placeholder="Note Name" required />
            </div>
            {/* <div className="col">
              <input type="text" className="form-control" name="description" placeholder="Note Description" required />
            </div> */}
            <div className="col">
              <button type="submit" className="btn btn-primary">Create Note</button>
            </div>
          </div>
        </form>
        
        <h2 className="mt-4">Current Notes</h2>
        <div className="mt-4">
          {notes.map((note) => (
            // Inside the map function for rendering notes
          <div key={note.id || note.name} className="row align-items-center">
            <div className="col">
              
              <strong>{note.name}</strong>
              <span>{note.description}</span>
            </div>
            <div className="col-auto">
              <button className="btn btn-link" onClick={() => deleteNote(note)}>Delete note</button>
             
            </div>
          </div>

          ))}
        </div>
      </div>

      <footer className="footer py-3 bg-light fixed-bottom">
        <div className="container text-center">
          <span className="text-muted">© 2024 My Notes App</span>
        </div>
      </footer>
    </div>
  );
}

export default withAuthenticator(App);
