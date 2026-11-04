/**
 * An edge-to-edge search strip (History): the search box loses its own border
 * and fills the strip; each filter after it is split off by one line. Focus
 * shows as an inset ring, as the strip has no box to colour.
 */
export const EDGE_SEARCH =
  "h-13 min-w-0 flex-1 rounded-none border-0 shadow-none hover:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-inset has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50";

export const EDGE_FILTER =
  "h-13! shrink-0 rounded-none border-0 border-l bg-transparent px-3 font-medium shadow-none focus-visible:ring-inset";
