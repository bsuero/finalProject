const Axios = require("axios")
const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const jwt = require('jsonwebtoken');


public_users.post("/register", (req,res) => {

  const username = req.body.username;
  const password = req.body.password;
  if(username&&password){
      const present = users.filter((user)=> user.username === username)
      if(present.length===0){
          users.push({"username":req.body.username,"password":req.body.password});
          return res.status(201).json({message:"USer Created successfully"})
      }
      else{
        return res.status(400).json({message:"Already exists"})
      }
  }
  else if(!username && !password){
    return res.status(400).json({message:"Bad request"})
  }
  else if(!username || !password){
    return res.status(400).json({message:"Check username and password"})
  }  

 
});

public_users.post("/login", (req,res) => {
  let user = req.body.username;
  let pass = req.body.password;
  if(!authenticatedUser(user,pass)){
      return res.status(403).json({message:"User not authenticated"})
  }

  
  let accessToken = jwt.sign({
      data: user
  },'access',{expiresIn:60*60})
  
  res.send("User logged in Successfully")

});

const authenticatedUser = (username,password)=>{ //returns boolean
  if(isValid(username)){
      let filtered_users = users.filter((user)=> (user.username===username)&&(user.password===password));
      if(filtered_users){
          return true;
      }
      return false;
     
  }
  return false;
  

}


// Get the book list available in the shop using async await
public_users.get('/', (req, res) => {
    const getBooks = () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(books);
            }, 1000);
        });
    }
    getBooks().then((books) => {
        res.json(books);
    }).catch((err) => {
        res.status(500).json({error: "An error occurred"});
    });
});


// // Get book details based on ISBN
// public_users.get('/isbn/:isbn',async (req, res)=>{
  
//   const ISBN = req.params.isbn;
//   await res.send(books[ISBN]);    
 
//  });
  
// Get book details based on ISBN using Promises
public_users.get('/isbn/:isbn', (req, res) =>{
    
    const ISBN = req.params.isbn;
    const booksBasedOnIsbn = (ISBN) => {
        return new Promise((resolve,reject) =>{
          setTimeout(() =>{
            const book = books[ISBN];
            if(book){
              resolve(book);
            }else{
              reject(new Error("Book not found"));
            }},1000);
        });
    
            
    }
    booksBasedOnIsbn(ISBN).then((book) =>{
      res.json(book);
    }).catch((err)=>{
      res.status(400).json({error:"Book not found"})
    });
      
    //await res.send(books[ISBN]);    
   
   });
    
// Get book details based on author
public_users.get('/author/:author', (req, res) => {
  const author = req.params.author;
  const booksBasedOnAuthor = (auth) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const filteredBooks = Object.values(books).filter(book => 
          book.author && book.author.toLowerCase() === auth.toLowerCase()
        );
        if (filteredBooks && filteredBooks.length > 0) {
          resolve(filteredBooks);
        } else {
          reject(new Error("No books found for this author"));
        }
      }, 1000);
    });
  };

  booksBasedOnAuthor(author)
    .then(books => {
      res.json(books);
    })
    .catch(err => {
      res.status(404).json({error: err.message});
    });

  
});

// Get all books based on title
public_users.get('/title/:title', (req, res) => {
  const title = req.params.title;
  
  const booksBasedOnTitle = (searchTitle) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const filteredBooks = Object.values(books).filter(book => 
          book.title && book.title.toLowerCase().includes(searchTitle.toLowerCase())
        );
        if (filteredBooks && filteredBooks.length > 0) {
          resolve(filteredBooks);
        } else {
          reject(new Error("No books found with this title"));
        }
      }, 1000);
    });
  };

  booksBasedOnTitle(title)
    .then(books => {
      res.json(books);
    })
    .catch(err => {
      res.status(404).json({error: err.message});
    });
});

// Get book reviews by ISBN
public_users.get('/review/:isbn', (req, res) => {
  const { isbn } = req.params;

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  if (!book.reviews || book.reviews.length === 0) {
    return res.status(404).json({ message: 'No reviews found for this book' });
  }
  res.json(book.reviews);
});

public_users.put("/auth/review/:isbn", (req, res) => {
  //Write your code here
  let userd = req.session.username;
  let ISBN = req.params.isbn;
  let details = req.query.review;
  let rev = {user:userd,review:details}
  books[ISBN].reviews = rev;
  return res.status(201).json({message:"Review added successfully"})
  
});

public_users.delete("/auth/review/:isbn", (req, res) => {
    let ISBN = req.params.isbn;
    books[ISBN].reviews = {}
    return res.status(200).json({messsage:"Review has been deleted"})
});

module.exports.general = public_users;