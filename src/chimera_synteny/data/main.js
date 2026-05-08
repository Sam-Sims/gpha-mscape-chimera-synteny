'use strict'

var familyRegex = /\(family\: (?<family>.*)\)/g
var familyTaxonSet = new Set()

    // add a data attribute to each plotly figure
    // with the family taxon
    // while also collecting unique taxa into a set
    ;[...document.getElementsByClassName("plotly-graph-div")].forEach(x => {
        var familyTaxon = x.layout.title.text.match(familyRegex)[0].split("family: ")[1].slice(0, -1)
        x.dataset.familyTaxon = familyTaxon
        familyTaxonSet.add(familyTaxon)
    })

class MscapeDropdown {
    constructor(dropdownName, values, linkedValues) {
        this.elm = document.createElement("select")

        this.elm.name = dropdownName
        this.elm.classList.add("mscapeDropdown")
        this.elm.setAttribute("onchange", "filterShowPlotsByFamily(this.value)")

        // set up default option
        var tempOptionElm = document.createElement("option")
        tempOptionElm.value = ""
        tempOptionElm.disabled = true
        tempOptionElm.selected = true
        tempOptionElm.innerHTML = `Select ${dropdownName.replaceAll("_", " ")}...`
        this.elm.append(tempOptionElm)

        // add actual options
        for (var i = 0; i < values.length; i++) {
            var tempVal = values[i]
            // use the linked value for the value if present
            // else use the value
            var tempLinkedVal = linkedValues && Object.keys(linkedValues).includes(tempVal) ? linkedValues[tempVal] != "none" ? linkedValues[tempVal] : tempVal : tempVal
            var tempOptionElm = document.createElement("option")

            tempOptionElm.value = tempLinkedVal
            tempOptionElm.innerHTML = tempVal

            this.elm.append(tempOptionElm)
        }
    }
}

class MscapeDropdownLabel {
    constructor(dropdownName, dropdownContainerElm) {
        this.elm = document.createElement("label")
        this.elm.innerHTML = dropdownName.replaceAll("_", " ")
        this.elm.classList.add("mscapeDropdownLabel")
        this.labelFor = document.querySelector(`select.mscapeDropdown[name="${dropdownName}"]`)

        dropdownContainerElm.insertBefore(this.elm, this.labelFor)
    }
}

function initDropdowns() {
    var dropdownElmsArray = []

    var mscapeConfig = { "family": { "values": [...familyTaxonSet] } }

    for (var dropdown in mscapeConfig) {
        dropdownElmsArray.push(
            new MscapeDropdown(
                dropdown,
                mscapeConfig[dropdown].values,
                mscapeConfig[dropdown].linked_values
            )
        )
    }

    // add to DOM
    var dropdownContainerElm = document.createElement("div")
    dropdownContainerElm.id = "dropdownContainer"
    document.body.prepend(dropdownContainerElm)
    dropdownContainerElm.append(...dropdownElmsArray.map(x => x.elm))

    // decorate with labels
    for (var dropdown in mscapeConfig) {
        new MscapeDropdownLabel(dropdown, dropdownContainerElm)
    }
}

function filterShowPlotsByFamily(inputFamily) {
    // find elm
    var filterStyleElm = document.getElementById("filterStyle")

    // remove if exists
    if (filterStyleElm) {
        filterStyleElm.remove()
    }

    // make it again
    filterStyleElm = document.createElement("style")
    filterStyleElm.id = "filterStyle"

    if (inputFamily) {
        var styleElmInner = `
            div.plotly-graph-div{
                display: none;
            }
            div.plotly-graph-div[data-family-taxon=${inputFamily}]{
                display: block;
            }
        `

        filterStyleElm.innerHTML = styleElmInner
    }

    // stick it in the DOM
    document.body.append(filterStyleElm)

    // hide empty subsections
    filterEmptyContainersByFamily(inputFamily)
}

function filterEmptyContainersByFamily(inputFamily) {
    // we'll show them all
    ;[...document.getElementsByClassName("hideEmptyContainer")].forEach(x => x.classList.remove("hideEmptyContainer"))

    // escape hatch for just
    // showing everything
    if (!inputFamily) {
        return
    }

    // hide the empty ones
    ;[...document.getElementsByClassName("figureAndHeaderContainer")].forEach(x => {
        if (!x.querySelectorAll(`div.plotly-graph-div[data-family-taxon=${inputFamily}]`).length) {
            x.classList.add("hideEmptyContainer")
        }
    })

    // add a reset button if we don't already have one
    if (!document.getElementById("resetBtn")) {
        var resetBtnElm = document.createElement("button")
        resetBtnElm.id = "resetBtn"
        resetBtnElm.setAttribute("onclick", "filterEmptyContainersByFamily(); filterShowPlotsByFamily(); document.getElementsByName('family')[0].selectedIndex = 0")
        resetBtnElm.innerHTML = "Show all"
        document.getElementsByName("family")[0].after(resetBtnElm)
    }
}

initDropdowns();