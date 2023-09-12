const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");

const app = express();
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Welcome to To-Do List !!"
});
const item2 = new Item({
  name: " '+' to add new item."
});
const item3 = new Item({
  name: "Click the 'Left Box' to delete the item."
});
const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemsSchema]
}
const List = mongoose.model("List", listSchema)


app.get("/", function (req, res) {
    Item.find({})
    .then(function(foundItem) {
        if (foundItem.length === 0) {   //add the default items i.e. Welcome to To-Do List !!
          Item.insertMany(defaultItems)
          .then(function() {
              // console.log("Successfully Added");
            })
            .catch(function (err) {
              console.log(err);
            });
            res.redirect("/")
        }
        else{
            res.render("list", { listTitle: "Today", newList: foundItem });
        }
      });
});

app.post("/", function (req, res) {
    // console.log(req.body);
    const itemName = req.body.newItem; //name of btn is newItem
    const listName = req.body.list; //name of btn is list
    
    const item = new Item({
        name: itemName
    })
    if(listName === "Today"){ //add default list ITEM
      item.save()
      res.redirect("/")
    }
    else{ //add CUSTOM LIST "ITEM"
      List.findOne({ name: listName })
      .then(function(foundList){
        if (foundList) {
          foundList.items.push(item)
          foundList.save()
          res.redirect("/" + listName)
        }
        else {
          // Handle the case when the list is not found
          console.log("List not found.")
          res.redirect("/")
        }
      })
      .catch(function(err){
        console.log(err);
      })
    }
});

app.get("/:customListName", function(req, res) {
  const customListName = lodash.capitalize(req.params.customListName) //capitalize the "Custom List Name"
  // console.log(req.params.customListName);
  // if (req.params.customListName === 'favicon.ico') {
  //   return;
  // }

  List.findOne({ name: customListName })
    .then(function(foundList){
        if (!foundList) {
          const list = new List({
            name: customListName,
            items: defaultItems
          })
          list.save()
          res.redirect("/" + customListName)
        }
        else {
          res.render("list", {listTitle: foundList.name, newList: foundList.items})
        }
    })
    .catch(function(err) {
      console.error(err);
    });
})

//DELETE a list item
app.post("/delete", function (req, res) {
  const checkboxItemID = req.body.checkbox //id to delete
  const listName = req.body.listName //CUSTOM LIST name which is feteched
 
  if(listName === "Today"){
    Item.findByIdAndRemove(checkboxItemID)
    .then(function (err) {
        // console.log(req.body)
        res.redirect("/")
    })
  }
  else{ //to delete ITEM from CUSTOM LIST
    //it pulls through the "ARRAY(i.e. the ITEMS)" and then the "ID" to remove
    List.findOneAndUpdate({name: listName}, { $pull: {items: {_id:checkboxItemID}} })
    .then (function (foundList) { //foundList -> found a list
      res.redirect("/" + listName)
    })
  }
})

// app.get("/work", function (req, res) {
//   res.render("list", { listTitle: "Work List", newList: workItems });
// });
// app.post("/work", function (req, res) {
//   res.redirect("/");
// });

app.listen(3000, function () {
  console.log("Listening on port 3000");
});
