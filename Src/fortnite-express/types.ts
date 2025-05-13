// https://fortnite-api.com/v2/cosmetics/new

export interface Fortnite {
    status: number;
    data:   Data;
}

export interface Data {
    items:         Items;
}

export interface Items {
    br:          Br[];
}

export interface Br {
    id:             string;
    name:           string;
    description:    string;
    type:           Rarity;
    rarity:         Rarity;
    series?:        Series;
    set?:           Set;
    introduction?:  Introduction;
    images:         BrImages;
    added:          Date;
}

export interface BrImages {
    smallIcon: string;
}

export interface Introduction {
    chapter:      string;
    season:       string;
}

export interface Rarity {
    value:        string;
}

export interface Series {
    value:        Value;
    image:        string;
}

export enum Value {
    IconSeries = "Icon Series",
    StarWarsSeries = "Star Wars Series",
}

export interface Set {
    value:        string;
    text:         string;
}

export interface Variant {
    channel: string;
    type:    string;
    options: Option[];
}

export interface Option {
    tag:   string;
    name:  string;
    image: string;
}