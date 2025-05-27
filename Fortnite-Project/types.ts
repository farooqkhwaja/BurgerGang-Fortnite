// https://fortnite-api.com/v2/cosmetics/new
// Cosmetics

export interface Fortnite {
    status: number;
    data: Data;
}

export interface Data {
    items: Items;
}

export interface Items {
    br: Br[];
}

export interface Br {
    id: string;
    name: string;
    description: string;
    type: Rarity;
    rarity: Rarity;
    series?: Series;
    set?: Set;
    introduction?: Introduction;
    images: BrImages;
    added: Date;
}

export interface BrImages {
    smallIcon: string;
}

export interface Introduction {
    chapter: string;
    season: string;
}

export interface Rarity {
    value: string;
}

export interface Series {
    value: Value;
    image: string;
}

export enum Value {
    IconSeries = "Icon Series",
    StarWarsSeries = "Star Wars Series",
}

export interface Set {
    value: string;
    text: string;
}

export interface Variant {
    channel: string;
    type: string;
    options: Option[];
}

export interface Option {
    tag: string;
    name: string;
    image: string;
}

// https://fortnite-api.com/v2/news/br
// News

export interface News {
    data: DataNews;
}

export interface DataNews {
    date: Date;
    motds: MOTD[];
}

export interface MOTD {
    title: string;
    body: string;
    image: string;
}

// https://fortnite-api.com/v2/shop
// Shop

export interface Shop {
    data: DataShop;
}

export interface DataShop {
    date: string;
    entries: Entry[];
}

export interface Entry {
    regularPrice: number;
    finalPrice: number;
    bundle?: Bundle;
    items?: Item[];
    brItems?: BrItem[];
}

export interface Item {
    id: string;
    name: string;
    description: string;
    type: Type;
    rarity: Rarity;
    series?: Series;
    images: Images;
    added: string;
}

export interface BrItem {
    id: string;
    name: string;
    description: string;
    type: Type;
    rarity: Rarity;
    series?: Series;
    set?: Set;
    introduction?: Introduction;
    images: Images;
    added: string;
}

export interface Bundle {
    name: string;
    info: string;
    image: string;
}

export interface Images {
    icon: string;
    featured?: string;
    smallIcon?: string;
    other?: Record<string, string>;
}

export interface Introduction {
    chapter: string;
    season: string;
    text: string;
}

export interface Rarity {
    id: string;
    name: string;
}

export interface Series {
    id: string;
    name: string;
}

export interface Set {
    id: string;
    name: string;
    partOf?: string;
}

export interface Type {
    id: string;
    name: string;
    value: string;
}