import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ContactDisplay({ refresh }) {
    const [contacts, setContacts] = useState([]);
    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState({ name: "", email: "", contact_number: "" });

    // Fetch contacts
    useEffect(() => {
        axios.get("/api/contacts")
            .then(res => setContacts(res.data))
            .catch(() => setContacts([]));
    }, [refresh]);

    // Start editing
    const handleEdit = (contact) => {
        setEditId(contact.id);
        setEditForm({
            name: contact.name,
            email: contact.email,
            contact_number: contact.contact_number
        });
    };

    // Save edit
    const handleEditSave = async (id) => {
        await axios.put(`/api/contacts/${id}`, editForm);
        setEditId(null);
        setEditForm({ name: "", email: "", contact_number: "" });
        // Refresh list
        axios.get("/api/contacts").then(res => setContacts(res.data));
    };

    // Cancel edit
    const handleEditCancel = () => {
        setEditId(null);
        setEditForm({ name: "", email: "", contact_number: "" });
    };

    // Archive contact
    const handleArchive = async (id) => {
        await axios.put(`/api/contacts/${id}`, { archived: true });
        axios.get("/api/contacts").then(res => setContacts(res.data));
    };

    // Delete contact
    const handleDelete = async (id) => {
        await axios.delete(`/api/contacts/${id}`);
        axios.get("/api/contacts").then(res => setContacts(res.data));
    };

    return (
        <div className="contact-list-display">
            <h3>Registered Contacts</h3>
            <ul>
                {contacts
                    .filter(contact => !contact.archived)
                    .map(contact => (
                    <li key={contact.id}>
                        {editId === contact.id ? (
                            <>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                />
                                <input
                                    type="text"
                                    value={editForm.contact_number}
                                    onChange={e => setEditForm({ ...editForm, contact_number: e.target.value })}
                                />
                                <button onClick={() => handleEditSave(contact.id)}>Save</button>
                                <button onClick={handleEditCancel}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <strong>{contact.name}</strong> | {contact.email} | {contact.contact_number}
                                <button onClick={() => handleEdit(contact)}>Edit</button>
                                <button onClick={() => handleArchive(contact.id)}>Archive</button>
                                <button onClick={() => handleDelete(contact.id)}>Delete</button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
            <h4>Archived Contacts</h4>
            <ul>
                {contacts
                    .filter(contact => contact.archived)
                    .map(contact => (
                    <li key={contact.id} style={{ opacity: 0.6 }}>
                        <strong>{contact.name}</strong> | {contact.email} | {contact.contact_number} (Archived)
                        <button onClick={async () => {
                          await axios.put(`/api/contacts/${contact.id}`, { archived: false });
                          axios.get("/api/contacts").then(res => setContacts(res.data));
                        }}>
                          Unarchive
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}