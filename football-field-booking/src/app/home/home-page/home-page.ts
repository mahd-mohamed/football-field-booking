import { Component } from '@angular/core';
import {  Navbar } from '../home-navbar/home-navbar';
import { HeroSection } from '../hero-section/hero-section';
import { FeaturesSection } from "../features-section/features-section";
import { AboutSection } from "../about-section/about-section";
import { ContactSection } from "../contact-section/contact-section";
import { Footer } from "../home-footer/home-footer";

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [Navbar, HeroSection, FeaturesSection, AboutSection, ContactSection, Footer],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage {
  heroActive = true;
}
