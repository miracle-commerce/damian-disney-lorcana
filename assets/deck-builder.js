
const formatMoney = Shopify.formatMoney = function(cents, format) {
  if (typeof cents == 'string') { cents = cents.replace('.',''); }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = (format || window.moneyFormat);

  function defaultOption(opt, def) {
     return (typeof opt == 'undefined' ? def : opt);
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal   = defaultOption(decimal, '.');

    if (isNaN(number) || number == null) { return 0; }

    number = (number/100.0).toFixed(precision);

    var parts   = number.split('.'),
        dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
        cents   = parts[1] ? (decimal + parts[1]) : '';

    return dollars + cents;
  }

  switch(formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
};

var totalDeckItemsCount = 0;
var totalDeckItemsCountsEl = document.querySelector("[data-deck-items-total-count]");
var deckTotalPrice = 0;
var totalPriceEl = document.querySelector("[data-deck-total-price]");
var deckSubmit = document.querySelector("[data-add-deck-cart]");
class DeckCardItem extends HTMLElement{
  constructor(){
    super();
    this.variantId = this.dataset.variantId; 
    this.quantity = parseInt(this.dataset.cardQuantity); 
    this.price = parseInt(this.dataset.price);
    this.qtylimit = parseInt(this.dataset.cardLimit);
    this.qtyController = this.querySelector("[data-qty-controller]");
    this.qtyValueEl = this.querySelector("[data-qty-value]"); 
    this.qtyIncreaseEl = this.querySelector("[data-qty-increase]"); 
    this.qtyDecreaseEl = this.querySelector("[data-qty-decrease]");
    this.qtyLimitEl = this.querySelector("[data-qty-limit-el]");
    this.category = this.dataset.category;
    this.deckCategoryEl = document.querySelector(`[data-deck-category= '${this.category}']`);
    this.deckCategoryItemsCountEl = this.deckCategoryEl.querySelector("[data-category-items-count]");
    this.deckCategoryItemsCount = parseInt(this.deckCategoryItemsCountEl.innerText);
    this.deckItemNode = this.querySelector("[data-deckItem-template]").content.cloneNode(true).querySelector("[data-deck-item]");
    this.deckItemIncreaseEl = this.deckItemNode.querySelector("[data-deck-item-qty-increase]");
    this.deckItemDecreaseEl = this.deckItemNode.querySelector("[data-deck-item-qty-decrease]");
    this.cardAdded = false;
    // Total Params for deck;


    this.addEventListener("changeQty", (e)=>{
      this.updateQuantity(e.detail.quantity);
      this.updateDeckItemNodeQuantity(e.detail.quantity);
      totalDeckItemsCount = totalDeckItemsCount - e.detail.oldQuantity + this.quantity
      totalDeckItemsCountsEl.innerText = totalDeckItemsCount;
      deckTotalPrice = deckTotalPrice - e.detail.oldQuantity * this.price + this.quantity * this.price;
      if(totalPriceEl){
        totalPriceEl.innerText = formatMoney(deckTotalPrice);
      }

      if(totalDeckItemsCount > 0 ){
        deckSubmit.classList.remove("disabled");
      }else{
        deckSubmit.classList.add("disabled");
      }
      
      // Update Category's Items count and El
      this.deckCategoryItemsCount = this.deckCategoryItemsCount - e.detail.oldQuantity + this.quantity;
      this.deckCategoryItemsCountEl.innerText = this.deckCategoryItemsCount;
      if(this.deckCategoryItemsCount == 0){
        this.deckCategoryEl.classList.add('disabled');
      }else if(this.deckCategoryItemsCount > 0){
        if(this.deckCategoryEl.classList.contains('disabled')){
          this.deckCategoryEl.classList.remove('disabled');
        }
      }
    });

    // Change Main Card Quantity
    this.qtyIncreaseEl.addEventListener('click', (e)=>{
      if(this.quantity < this.qtylimit){
        let newQty = this.quantity + 1; 
        this.dispatchEvent(new CustomEvent("changeQty", {detail: {
          oldQuantity: this.quantity,
          quantity: newQty
        }}))
      }
    });

    this.qtyDecreaseEl.addEventListener('click', ()=>{
      if(this.quantity > 0){
        let newQty = this.quantity - 1; 
        this.dispatchEvent(new CustomEvent("changeQty", {detail: {
          oldQuantity: this.quantity,
          quantity: newQty
        }}))
      }
    });

    // Add event listener to deck item's quantity control 
    this.deckItemIncreaseEl.addEventListener('click', ()=>{
      if(this.quantity < this.qtylimit){
        let newQty = this.quantity + 1; 
        this.dispatchEvent(new CustomEvent("changeQty", {detail: {
          oldQuantity: this.quantity,
          quantity: newQty
        }}))
      }
    });

    this.deckItemDecreaseEl.addEventListener('click', ()=>{
      if(this.quantity > 0 ){
        let newQty = this.quantity - 1;
        this.dispatchEvent(new CustomEvent("changeQty", {detail: {
          oldQuantity: this.quantity,
          quantity: newQty
        }}))
      }
    })
  }

  updateQuantity(qty){
    this.quantity = qty; 
    this.dataset.cardQuantity = qty;
    this.qtyValueEl.innerText = qty;
    if(qty == 0){
      this.qtyDecreaseEl.classList.add('disabled');
    } else {
      if(qty == this.qtylimit){
        this.qtyIncreaseEl.classList.add('disabled');
      } else{
        if(this.qtyDecreaseEl.classList.contains('disabled')){
          this.qtyDecreaseEl.classList.remove('disabled');
        }
        if(this.qtyIncreaseEl.classList.contains('disabled')){
          this.qtyIncreaseEl.classList.remove('disabled');
        }
      }
    }
      
  }

  // Method for deck Item
  updateDeckItemNodeQuantity(qty){
    this.deckItemNode.dataset.cardQuantity = qty;
    this.deckItemNode.querySelector("[data-deck-item-quantity]").innerText = qty;
    if(qty == 0){
      this.deckCategoryEl.removeChild(this.deckItemNode);
      this.cardAdded = false;
    }else{
      if(this.cardAdded == false){
        this.deckCategoryEl.appendChild(this.deckItemNode);
      }
      if(qty == this.qtylimit){
        this.deckItemIncreaseEl.classList.add('disabled');
      }else if(this.deckItemIncreaseEl.classList.contains('disabled')){
        this.deckItemIncreaseEl.classList.remove('disabled')
      }
    }
  }
}

customElements.define('deck-card-item', DeckCardItem);

// Script for AddDeckToCart
//create items
var cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');

const createDeckItemsData = function(){
  var deckItemsData = {};
  let deckItemEls = document.querySelectorAll("[data-deck-item]");
  let deckItems = [];
    if(deckItemEls.length > 0){
      deckItemEls.forEach((deckItemEl) =>{
        deckItems.push({"id": parseInt(deckItemEl.dataset.itemId), "quantity": parseInt(deckItemEl.dataset.cardQuantity)});
      })
      deckItemsData["items"] = deckItems;
      if(cart){
        deckItemsData.sections = cart.getSectionsToRender().map((section) => section.id);
        deckItemsData.sections_url = window.location.pathname;
        cart.setActiveElement(document.activeElement);
      }
      
      return deckItemsData;

    } else {
      return false;
    }
}
document.querySelector("[data-add-deck-cart]").addEventListener('click', (e)=>{
  if(createDeckItemsData()){
    let deckItemsData = createDeckItemsData();
    deckSubmit.classList.add("loading");
    fetch(`${routes.cart_add_url}`, {
      method: 'POST', 
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type':'application/json',
        Accept: `application/json`
      }, 
      body: JSON.stringify(deckItemsData),
    })
    .then((response)=> response.json())
    .then((response) => {
      cart.renderContents(response);
    })
    .catch((e)=>{
      console.error(e);
    })
    .finally(()=>{
      deckSubmit.classList.remove("loading");
    })
  }
})

document.querySelectorAll("[data-deck-panel-switch]").forEach((deckPanelSwitch)=>{
  let target = deckPanelSwitch.dataset.deckPanelSwitch;
  deckPanelSwitch.addEventListener('click', (e)=>{
    if(target == 'card'){
      let targetEl = document.querySelector("[data-card-panel]");
      if(targetEl.classList.contains("mobile-hidden")){
        targetEl.classList.remove("mobile-hidden");
        document.querySelector("[data-deck-panel]").classList.add("mobile-hidden");
      }
    }else if(target == 'deck'){
      let targetEl = document.querySelector("[data-deck-panel]");
      if(targetEl.classList.contains("mobile-hidden")){
        targetEl.classList.remove("mobile-hidden");
        document.querySelector("[data-card-panel]").classList.add("mobile-hidden");
      }
    }
  })
})